import gevent.monkey
gevent.monkey.patch_all()

import eel
import requests
import time
import math
import sys
import os
import subprocess
import shutil
import parse_emails
import youtube_scrape
import youtube_dl
import pygame
from mutagen.oggvorbis import OggVorbis
from mutagen.id3 import ID3NoHeaderError
from mutagen.id3 import ID3, TIT2, TALB, TPE1, TPE2, COMM, TCOM, TCON, TDRC, APIC
from bs4 import BeautifulSoup
import artist_finder

play_queue = []
current_song = {}
paused = False
radio = False
server_listening = False
skip = False
curr_song_length = float('inf')
has_started = False
p = None
eel.init('web')


def handle_song(artist, title, queue_item=None):
    global play_queue
    """This function prepares the song for playing before calling start_song"""

    # This function is called both when there are no songs currently playing, in which case we want to call getAlbumArt,
    # but also when we are downloading songs currently in the queue to play for later. In this case we don't want to get
    # the album art at this time
    if not queue_item:
        queue_item = play_queue[0]
        eel.artLoading(True)
        eel.getAlbumArt(title, artist)

    # This gets the duration of the song from the youtube page itself. This is no longer needed, as we find the actual
    # length of the song file once it's downloaded
    video_url = "https://youtube.com" + queue_item[2]
    while queue_item[4] == 'downloading':
        eel.sleep(1)
    # duration = youtube_scrape.get_video_time(video_url)

    if os.path.exists('./Music/temp/'+title+'.ogg'):
        #start_song(title)
        return

    queue_item[4] = 'downloading'
    options = {
        'format': 'best',
        'outtmpl': './Music/temp/'+title+".%(ext)s",
        'nocheckcertificate': True,
          'external_downloader_args': [{
              'hide_banner': True,
              'loglevel': 'quiet, -8',
              'nostats': True,
              'nostdin': True
          }],
          'postprocessors': [{
              'key': 'FFmpegExtractAudio',
              'preferredcodec': 'vorbis',
          }]
    }
    with youtube_dl.YoutubeDL(options) as ydl:
        try:
            ydl.download([video_url])
        except youtube_dl.DownloadError:
            pass

    CREATE_NO_WINDOW = 0x08000000
    file_title = title.translate ({ord(c): "#" for c in "!@#$%^\"*{};:/<>?\|`~=_"})
    print(file_title)
    queue_item[4] = 'ready'
    #subprocess.Popen(['ffmpeg.exe', '-i', '".\Music\\temp\\'+title+'.mp4"', '-acodec libmp3lame ".\Music\\temp\\'+title+'.mp3']) #creationflags=CREATE_NO_WINDOW)
    #subprocess.Popen('ffmpeg.exe -i ".\Music\\temp\\'+file_title+'.mp4" -acodec libmp3lame ".\Music\\temp\\'+file_title+'.mp3', creationflags=CREATE_NO_WINDOW) #creationflags=CREATE_NO_WINDOW)

    # Return the song length
    # return duration


def start_song(song):
    """Play song with PyGame at correct sample rate"""
    global curr_song_length
    global has_started
    song_loaded = False

    # youtube_dl replaces some characters with #, so we replace any of those with # here to get the correct filename.
    file_title = song.translate({ord(c): "#" for c in "!@#$%^\"*{};:/<>?\|`~=_"})

    # Keep trying to load the song until we do
    while not song_loaded:
        try:
            # Get song length and set global var, and get frequency and play with pygame at that freq. (stupid that pygame wouldn't
            # do this automatically)
            song_file = OggVorbis("./Music/temp/" + file_title + ".ogg")
            curr_song_length = song_file.info.length * 1000
            pygame.mixer.init(frequency=song_file.info.sample_rate)
            pygame.mixer.music.load("./Music/temp/" + file_title + ".ogg")
            song_loaded = True
        except:
            pass

    # Remove the specified classes on the webpage, and setup the seekbar's animation
    eel.artLoading(False)
    eel.getPercent(curr_song_length)
    eel.setCurrSongLength(curr_song_length);

    pygame.mixer.music.play()
    time.sleep(2)
    has_started = True


@eel.expose
def get_lyrics(artist, title):
    # Although last.fm does not have an API call for lyrics, they do store them.
    # Here, we scrape the page for them.
    header = {'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'}
    try:
        response = requests.get('https://www.last.fm/music/'+artist.replace(' ','+')+'/_/'+title.replace(' ','+')+'/+lyrics', headers=header)
    except requests.exceptions.ConnectionError:
        return None, None

    content = response.content
    soup = BeautifulSoup(content, "html.parser")

    all_title_tags = soup.find_all("span", attrs={"itemprop": "text"})

    return str(all_title_tags[0])


@eel.expose
def set_email(email, pwd, server):
    """This function sets up the email service to begin searching for incoming requests"""
    global server_listening
    parse_emails.set_variables(email, pwd, server)
    server_listening = True


@eel.expose
def set_time(percent):
    """This sets the music time to a certain percent of the way through the song, called when the user
    clicks somewhere on the playbar"""
    global curr_song_length
    time_to_set = ((curr_song_length/1000) * percent) / 100
    pygame.mixer.music.rewind()
    pygame.mixer.music.set_pos(time_to_set)

    # We return the time left in the song after setting this so that the playbar can resume movement
    # and knows over how much time to animate
    return (curr_song_length/1000)-time_to_set

@eel.expose
def unset_email():
    """This function disables the email service"""
    global server_listening
    server_listening = False


@eel.expose
def get_email():
    """This function returns whether or not the email service is playing"""
    global server_listening
    return server_listening


@eel.expose
def swap_queue(index1, index2):
    """This function facilitates in changing the queue. Javascript determines which songs have been switched when the user
    switches them, and then passes them here to actually complete the process"""
    play_queue.insert(int(index2)+1, play_queue.pop(int(index1)+1))


@eel.expose
def pause_music(curr_percent):
    global paused
    global curr_song_length

    eel.togglePlayButton(paused)
    if not paused:
        pygame.mixer.music.pause()
        paused = True
        return 'pausing'
    else:
        time_left = curr_song_length - ((curr_percent * curr_song_length) / 100)
        pygame.mixer.music.unpause()
        paused = False
        return time_left/1000


@eel.expose
def fast_forward():
    global skip
    skip = True


@eel.expose
def download_song(data):
    global play_queue
    global p
    try:
        os.makedirs("./Music/saved/"+data['track']['artist']['name']+'/'
                    + data['track']['album']['title'].title())
    except FileExistsError:
        pass


    if os.path.isfile('./Music/saved/'+play_queue[0][1].title()+'/'+data['track']['album']['title']+'/'+play_queue[0][0].title()+'.mp3'):
        os.remove('./Music/saved/'+play_queue[0][1].title()+'/'+data['track']['album']['title']+'/'+play_queue[0][0].title()+'.mp3');
        return

    if sys.platform == 'win32':
        p = subprocess.Popen('ffmpeg -i "./Music/temp/'+play_queue[0][0].title()+'.ogg" -acodec libmp3lame "./Music/temp/'+play_queue[0][0].title()+'.mp3')
    else:
        p = subprocess.Popen(['./ffmpeg', '-i', "./Music/temp/"+play_queue[0][0].title()+'.ogg', '-acodec', 'libmp3lame', "./Music/temp/"+play_queue[0][0].title()+'.mp3'])
    # os.system('ffmpeg -i "./Music/temp/'+play_queue[0][0].title()+'.ogg" -acodec libmp3lame "./Music/temp/'+play_queue[0][0].title()+'.mp3"')
    p.communicate()


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
    os.remove("./Music/temp/" + play_queue[0][0] + ".mp3")

    eel.toggleEnabled("#dl", True)


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
    play_queue.append([real_title, artist, link, "user", 'waiting'])


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
            # song_title = i[0].translate({ord(c): "#" for c in "!@#$%^\"&*{};:/<>?\|`~=_"})
            if not os.path.exists("./Music/temp/"+i[0]+'.ogg'):
                handle_song(i[1], i[0], play_queue[play_queue.index(i)])

        for file in os.listdir('./Music/temp/'):
            if file.rsplit('.', 1)[0] not in [i[0] for i in play_queue]:
                try:
                    os.remove('./Music/temp/'+file)
                except PermissionError:
                    pass
                except IsADirectoryError:
                    shutil.rmtree('./Music/temp/'+file)
        eel.sleep(0.5)


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
                play_queue.append([song, artist, link, "email", 'waiting'])
        eel.sleep(0.5)


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
                play_queue.append([song, artist, link, "radio", 'waiting'])
            except:
                pass

        eel.sleep(0.5)


def play_music():
    global radio
    global play_queue
    global paused
    global skip
    global has_started
    global curr_song_length

    while True:

        if curr_song_length == float('inf') and play_queue:
            artist, song = play_queue[0][1], play_queue[0][0]
            #eel.sleep(2)
            handle_song(artist, song)
            start_song(song)

        # Check time, and if the duration of the song has passed, handle things
        if (has_started and not pygame.mixer.music.get_busy()) or skip:
            skip = False
            has_started = False
            pygame.mixer.stop()
            pygame.mixer.quit()

            play_queue.pop(0)
            print("Queue updated:")
            print(play_queue)

            #eel.sleep(2)
            # If there's a song in the queue, play it; otherwise, do nothing
            if play_queue:
                artist, song = play_queue[0][1], play_queue[0][0]
                handle_song(artist, song)
                print("Now playing: " + artist + " - " + song)
                start_song(song)
            else:
                curr_song_length = float('inf')

        eel.sleep(0.5)


options = {
    'mode': 'custom',
    'args': ['../../electron.exe', '.']
}

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

