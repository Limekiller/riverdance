import gevent.monkey
gevent.monkey.patch_all()

import eel
import time
import math
import os
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
        'outtmpl': './Music/'+title+".%(ext)s",
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
    song_file = mutagen.mp3.MP3("./Music/" + song + ".mp3")
    pygame.mixer.init(frequency=song_file.info.sample_rate)
    pygame.mixer.music.load("./Music/" + song + ".mp3")
    eel.artLoading(False)
    pygame.mixer.music.play()


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
def get_queue():
    global play_queue
    return play_queue


@eel.expose
def begin_playback():
    eel.spawn(play_music)


def play_music():
    global play_queue
    last_artist = ''
    last_song = ''
    time_start = time.time()
    time_to_end = math.inf
    loops_without_music = 0
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

        # Check time, and if the duration of the song has passed, handle things
        time_end = time.time()
        if time_end - time_start >= time_to_end:
            pygame.mixer.stop()
            pygame.mixer.quit()
            # Attempt to delete all files in directory
            for file in os.scandir('./Music/'):
                try:
                    os.remove(file)
                except PermissionError:
                    pass

            last_played_artist = play_queue[0][1]
            play_queue.pop(0)
            print("Queue updated:")
            print(play_queue)

            # If there's a song in the queue, play it; otherwise, do nothing
            if play_queue:
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

        # If nobody has submitted a play request in five loops, find a similar artist to the last played artist
        # And play a song in their top 20
        # if loops_without_music > 2:
        #     loops_without_music = 0
        #     artist = artist_finder.find_similar_artist(last_played_artist)
        #     song = artist_finder.get_artist_song(artist)
        #     if not artist or not song:
        #         time_to_end = math.inf
        #         continue
        #     print("Now playing: " + artist + " - " + song)
        #
        #     play_queue.append([song, artist])
        #     print("Queue updated:")
        #     print(play_queue)
        #     time_to_end = handle_song(song)
        #     if not time_to_end:
        #         time_to_end = math.inf
        #         play_queue.pop()
        #         continue
        #     start_song(song)
        #     time_start = time.time()

        if not play_queue:
            loops_without_music += 1

        time.sleep(2)


options = {
    'mode': 'custom',
    'args': ['C:\\Users\\bryod\\node_modules\electron\dist\electron.exe', '.']
}
play_queue = []
paused = False

eel.start('main.html')

