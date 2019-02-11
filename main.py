import gevent.monkey
gevent.monkey.patch_all()

import eel
import time
import math
import os
import shutil
import parse_emails
import youtube_scrape
import youtube_dl
import pygame
import mutagen.mp3
import artist_finder

eel.init('web')


def handle_song(artist, title):
    """Search YouTube for videos and download the best result"""
    eel.artLoading(True)
    video_url = "https://youtube.com"+play_queue[0][2]
    duration = youtube_scrape.get_video_time(video_url)

    # If the function fails, return null
    if not duration:
        return duration

    eel.getAlbumArt(title, artist)

    duration = duration / 1000
    options = {
        'format': 'bestaudio/best',
        'outtmpl': './Music/temp/'+title+".%(ext)s",
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
        }]
    }
    with youtube_dl.YoutubeDL(options) as ydl:
        ydl.download([video_url])

    # Return the song length
    return duration


def start_song(song):
    """Play song with PyGame at correct sample rate"""
    song_file = mutagen.mp3.MP3("./Music/temp/" + song + ".mp3")
    pygame.mixer.init(frequency=song_file.info.sample_rate)
    pygame.mixer.music.load("./Music/temp/" + song + ".mp3")
    eel.artLoading(False)
    pygame.mixer.music.play()


@eel.expose
def set_email(email, pwd, server):
    global server_listening
    parse_emails.set_variables(email, pwd, server)
    server_listening = True


@eel.expose
def unset_email():
    global server_listening
    server_listening = False


@eel.expose
def pause_music():
    global paused
    if not paused:
        pygame.mixer.music.pause()
        paused = True
    else:
        pygame.mixer.music.unpause()
        paused = False


@eel.expose
def fast_forward():
    global time_to_end
    time_to_end = 0


@eel.expose
def download_song():
    global play_queue
    try:
        os.makedirs("./Music/saved/"+play_queue[0][1].title())
    except FileExistsError:
        pass
    shutil.copyfile("./Music/temp/"+play_queue[0][0]+".mp3", "./Music/saved/"+play_queue[0][1].title()+"/"+play_queue[0][0].title()+".mp3")


@eel.expose
def get_search_results(search_title, search_artist):
    titles, links = youtube_scrape.scrape(search_title, search_artist)
    return_string = ""
    for i in range(len(titles)):
        return_string += "<div class='search_result' onclick='addToQueue(\""+links[i]+"\", \""+titles[i].title()+"\", \""+search_artist+"\")'>"+titles[i].title()+"</div>"
    return return_string


@eel.expose
def add_to_queue(title, artist):
    global play_queue
    real_title, link = youtube_scrape.scrape(title, artist, True)
    play_queue.append([real_title, artist, link])


@eel.expose
def delete_from_queue(index):
    global play_queue
    play_queue.pop(int(index)+1)
    print(play_queue)


@eel.expose
def toggle_radio():
    global radio
    if radio:
        radio = False
    else:
        radio = True
    print(radio)
    return radio


@eel.expose
def get_queue():
    global play_queue
    return play_queue


@eel.expose
def begin_playback():
    eel.spawn(play_music)


def check_email():
    global server_listening
    last_email = None
    while True:
        if server_listening:
            email = parse_emails.readmail()
            if email != last_email:
                last_email = email
                song = last_email[0]
                artist = last_email[1]
                song, link = youtube_scrape.scrape(song, artist, True)
                play_queue.append([song, artist, link])
        eel.sleep(5)


def use_radio():
    while True:
        if radio and len(play_queue) < 5:
            # loops_without_music = 0
            artist = artist_finder.find_similar_artist(play_queue[0][1])
            song = artist_finder.get_artist_song(artist)
            if not artist or not song:
                return
            song, link = youtube_scrape.scrape(song, artist, True)
            play_queue.append([song, artist, link])
        eel.sleep(1)


def play_music():
    global radio
    global play_queue
    global paused
    global time_to_end

    last_artist = ''
    last_song = ''
    time_start = time.time()
    while True:
        # Get last email and set artist+song variables
        # artist, song = parse_emails.readmail()
        #
        # if artist != last_artist or song != last_song:
        #     loops_without_music = 0
        #     last_artist, last_song = artist, song
        #
        #     # If there's nothing in the queue, start playing the song; otherwise just append it to the queue
        #     if not play_queue:
        #         play_queue.append(youtube_scrape.scrape(song, artist, True))
        #         print("Queue updated:")
        #         print(play_queue)
        #         print("Now playing: " + artist + " - " + song)
        #
        #         # Get song duration and download file
        #         time_to_end = handle_song(song)
        #
        #         # If duration is Null, skip it
        #         if not time_to_end:
        #             last_artist, last_song = '', ''
        #             continue
        #         start_song(song)
        #         time_start = time.time()
        #     else:
        #         play_queue.append(youtube_scrape.scrape(song, artist, True))
        #         print("Queue updated:")
        #         print(play_queue)
        if time_to_end == math.inf and play_queue:
            last_artist, last_song = play_queue[0][1], play_queue[0][0]
            song = last_song
            artist = last_artist
            time_to_end = handle_song(artist, song)
            start_song(song)
            time_start = time.time()

        if paused:
            time_to_end += time.time() - time_end

        # Check time, and if the duration of the song has passed, handle things
        time_end = time.time()
        if time_end - time_start >= time_to_end:
            print(time_to_end)
            pygame.mixer.stop()
            pygame.mixer.quit()
            # Attempt to delete all files in directory
            for file in os.scandir('./Music/temp/'):
                try:
                    os.remove(file)
                except PermissionError:
                    pass

            play_queue.pop(0)
            print("Queue updated:")
            print(play_queue)

            # If there's a song in the queue, play it; otherwise, do nothing
            if play_queue:
                # loops_without_music = 0
                artist, song = play_queue[0][1], play_queue[0][0]
                print("Now playing: " + artist + " - " + song)
                time_to_end = handle_song(artist, song)
                time_start = time.time()
                if not time_to_end:
                    last_artist, last_song = '', ''
                    continue
                start_song(song)
            else:
                time_to_end = math.inf

        time.sleep(2)


options = {
    'mode': 'custom',
    'args': ['C:\\Users\\bryod\\node_modules\electron\dist\electron.exe', '.']
}
play_queue = []
paused = False
radio = False
server_listening = False
time_to_end = math.inf

eel.spawn(use_radio)
eel.spawn(check_email)
eel.start('main.html', options=options)

