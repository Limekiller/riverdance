import gevent.monkey
gevent.monkey.patch_all()

import eel
import requests
import time
import math
import sys
import os
import shutil
import parse_emails
import youtube_scrape
import youtube_dl
import pygame
import mutagen.mp3
from mutagen.id3 import ID3NoHeaderError
from mutagen.id3 import ID3, TIT2, TALB, TPE1, TPE2, COMM, TCOM, TCON, TDRC, APIC
from bs4 import BeautifulSoup
import artist_finder

eel.init('web')


def handle_song(artist, title, queue_item=0):
    """Search YouTube for videos and download the best result"""

    if not queue_item:
        eel.artLoading(True)
        eel.getAlbumArt(title, artist)

    video_url = "https://youtube.com" + play_queue[queue_item][2]
    duration = youtube_scrape.get_video_time(video_url)

    # If the function fails, return null
    if not duration:
        return duration
    duration = duration / 1000

    if os.path.exists('./Music/temp/'+title+'.mp3'):
        start_song(title)
        return duration

    options = {
        'format': 'best',
        'outtmpl': './Music/temp/'+title+".%(ext)s",
        'nocheckcertificate': True,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
        }]
    }
    with youtube_dl.YoutubeDL(options) as ydl:
        try:
            ydl.download([video_url])
        except youtube_dl.DownloadError:
            fast_forward()

    # Return the song length
    return duration


def start_song(song):
    """Play song with PyGame at correct sample rate"""
    song_file = mutagen.mp3.MP3("./Music/temp/" + song + ".mp3")
    pygame.mixer.init(frequency=song_file.info.sample_rate)
    song_loaded = False
    while not song_loaded:
        try:
            pygame.mixer.music.load("./Music/temp/" + song + ".mp3")
            song_loaded = True
        except:
            pass
    eel.artLoading(False)
    pygame.mixer.music.play()


@eel.expose
def get_lyrics(artist, title):
    header = {'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'}
    try:
        print('https://www.last.fm/music/'+artist.replace(' ','+')+'/_/'+title.replace(' ','+')+'/+lyrics')
        response = requests.get('https://www.last.fm/music/'+artist.replace(' ','+')+'/_/'+title.replace(' ','+')+'/+lyrics', headers=header)
    except requests.exceptions.ConnectionError:
        return None, None

    content = response.content
    soup = BeautifulSoup(content, "html.parser")

    all_title_tags = soup.find_all("span", attrs={"itemprop": "text"})

    return str(all_title_tags[0])


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
def get_email():
    global server_listening
    return server_listening


@eel.expose
def swap_queue(index1, index2):
    play_queue.insert(int(index2)+1, play_queue.pop(int(index1)+1))


@eel.expose
def pause_music():
    global paused
    eel.togglePlayButton(paused)
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
def download_song(data):
    global play_queue
    print(data)
    try:
        os.makedirs("./Music/saved/"+data['track']['artist']['name']+'/'
                    + data['track']['album']['title'].title())
    except FileExistsError:
        pass

    if os.path.isfile('./Music/saved/'+play_queue[0][1].title()+'/'+data['track']['album']['title']+'/'+play_queue[0][0].title()+'.mp3'):
        os.remove('./Music/saved/'+play_queue[0][1].title()+'/'+data['track']['album']['title']+'/'+play_queue[0][0].title()+'.mp3');
        return

    shutil.copyfile("./Music/temp/" + play_queue[0][0] + ".mp3", "./Music/saved/" + play_queue[0][1].title()
                    + "/" + data['track']['album']['title'] + '/' + play_queue[0][0].title() + ".mp3")

    try:
        tags = ID3("./Music/saved/" + play_queue[0][1].title()
                    + "/" + data['track']['album']['title'] + '/' + play_queue[0][0].title() + ".mp3")
    except ID3NoHeaderError:
        tags = ID3()

    response = requests.get(data['track']['album']['image'][-1]['#text']).content
    with open('./Music/temp/img.png', 'wb') as handle:
        handle.write(response)

    tags["TIT2"] = TIT2(encoding=3, text=data['track']['name'])
    tags["TALB"] = TALB(encoding=3, text=data['track']['album']['title'])
    tags["TPE2"] = TPE2(encoding=3, text=data['track']['artist']['name'])
    tags["TPE1"] = TPE1(encoding=3, text=data['track']['artist']['name'])
    tags["TCOM"] = TCOM(encoding=3, text=data['track']['artist']['name'])
    albumart = open('./Music/temp/img.png', 'rb').read()
    tags.add(APIC(encoding=3, mime='image/png', type=3, data=albumart))

    tags.save("./Music/saved/" + play_queue[0][1].title()
                    + "/" + data['track']['album']['title'] + '/' + play_queue[0][0].title() + ".mp3", v2_version=3)




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
    print(title, artist)
    real_title, link = youtube_scrape.scrape(title, artist, True)
    real_title = real_title.split(' - ')[-1]
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


def dl_songs_in_bg():
    while True:
        for i in play_queue:
            if not os.path.exists("./Music/temp/"+i[0]+'.mp3'):
                handle_song(i[1], i[0], play_queue.index(i))

        for file in os.listdir('./Music/temp/'):
            if file.rsplit('.', 1)[0] not in [i[0] for i in play_queue]:
                try:
                    os.remove('./Music/temp/'+file)
                except PermissionError:
                    pass
        eel.sleep(10)


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
    global radio
    while True:
        if radio and len(play_queue) < 5:
            # loops_without_music = 0
            try:
                artist = artist_finder.find_similar_artist(play_queue[0][1])
                song = artist_finder.get_artist_song(artist)
                song, link = youtube_scrape.scrape(song, artist, True)
                song = song.split(' - ')[-1]
                play_queue.append([song, artist, link])
            except:
                pass

        eel.sleep(1)


def play_music():
    global radio
    global play_queue
    global paused
    global time_to_end

    time_start = time.time()
    while True:

        if time_to_end == math.inf and play_queue:
            last_artist, last_song = play_queue[0][1], play_queue[0][0]
            song = last_song
            artist = last_artist
            time_to_end = handle_song(artist, song)
            eel.sleep(2)
            start_song(song)
            time_start = time.time()

        if paused:
            time_to_end += time.time() - time_end

        # Check time, and if the duration of the song has passed, handle things
        time_end = time.time()
        if time_end - time_start >= time_to_end:
            pygame.mixer.stop()
            pygame.mixer.quit()

            play_queue.pop(0)
            print("Queue updated:")
            print(play_queue)

            eel.sleep(2)
            # If there's a song in the queue, play it; otherwise, do nothing
            if play_queue:
                artist, song = play_queue[0][1], play_queue[0][0]
                print("Now playing: " + artist + " - " + song)
                time_to_end = handle_song(artist, song)
                time_start = time.time()
                if not time_to_end:
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
current_song = {}
paused = False
radio = False
server_listening = False
time_to_end = math.inf

if sys.platform == "darwin":
    os.environ['PATH'] += ':'+os.getcwd()
if not os.path.exists('./Music'):
    os.makedirs('./Music/')
    os.makedirs('./Music/temp/')
    os.makedirs('./Music/saved/')

eel.spawn(use_radio)
eel.spawn(check_email)
eel.spawn(dl_songs_in_bg)
eel.start('main.html')

