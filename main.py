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
import youtube_dl
import pygame

from mutagen.oggvorbis import OggVorbis
from mutagen.id3 import ID3NoHeaderError
from mutagen.id3 import ID3, TIT2, TALB, TPE1, TPE2, COMM, TCOM, TCON, TDRC, APIC
from bs4 import BeautifulSoup

import parse_emails
import youtube_scrape
import artist_finder

# Because of eel, we must use global variables. RIP
play_queue = []
current_song = {}
paused = False
radio = False
server_listening = False
skip = False
curr_song_length = float('inf')
has_started = False
volume = 0.5
already_downloaded = False
p = None

eel.init('web')


def find_song(title, artist):
    """This function searches to see if a song has already been saved on the computer"""
    global already_downloaded
    for saved_artist in os.listdir('./Music/saved'):
        if artist.lower() == saved_artist.lower():
            for saved_album in os.listdir('./Music/saved/'+saved_artist):
                for saved_song in os.listdir('./Music/saved/'+saved_artist+'/'+saved_album):
                    if title.lower()+'.ogg' == saved_song.lower():
                        shutil.copyfile("./Music/saved/"+saved_artist+"/"+saved_album+"/"+saved_song, "./Music/temp/"+saved_song.lower())
                        already_downloaded = True
                        return True
    return False


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

    if find_song(title, artist):
        queue_item[4] = 'ready'
        return
    if os.path.exists('./Music/temp/'+title+'.ogg'):
        #start_song(title)
        return


    file_title = title.translate ({ord(c): "#" for c in "!@#$%^\"*{};&:/<>?\|`~=_"})
    queue_item[4] = 'downloading'
    options = {
        'format': 'best',
        'outtmpl': './Music/temp/'+file_title+".%(ext)s",
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
    downloaded = False
    while not downloaded:
        with youtube_dl.YoutubeDL(options) as ydl:
            try:
                ydl.download([video_url])
                downloaded = True
            except:
                continue

    CREATE_NO_WINDOW = 0x08000000
    queue_item[4] = 'ready'
    #subprocess.Popen(['ffmpeg.exe', '-i', '".\Music\\temp\\'+title+'.mp4"', '-acodec libmp3lame ".\Music\\temp\\'+title+'.mp3']) #creationflags=CREATE_NO_WINDOW)
    # subprocess.Popen('ffmpeg.exe -i ".\Music\\temp\\'+file_title+'.mp4" -map 0:a:0 -b:a 96k ".\Music\\temp\\'+file_title+'.ogg', creationflags=CREATE_NO_WINDOW) #creationflags=CREATE_NO_WINDOW)

    # Return the song length
    # return duration


def start_song(song):
    """Play song with PyGame at correct sample rate"""
    global curr_song_length
    global has_started
    global already_downloaded
    global volume
    song_loaded = False

    # youtube_dl replaces some characters with #, so we replace any of those with # here to get the correct filename.
    file_title = song.translate({ord(c): "#" for c in "!@#$%^\"*{}&;:/<>?\|`~=_"})

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

    pygame.mixer.music.set_volume(volume)

    # Remove the specified classes on the webpage, and setup the seekbar's animation
    eel.artLoading(False)
    eel.getPercent(curr_song_length)
    eel.setCurrSongLength(curr_song_length);

    # If it's playing a downloaded song, change the UI so that deletion is possible
    if (already_downloaded):
        eel.toggleEnabled("#dl", False)
        eel.toggleEnabled("#dl", True)
        already_downloaded = False

    pygame.mixer.music.play()
    time.sleep(2)
    has_started = True



@eel.expose
def get_artist_image(artist):
    header = {'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'}
    try:
        response = requests.get('https://www.last.fm/music/'+artist.replace(' ','+'))
    except requests.exceptions.ConnectionError:
        return None, None

    content = response.content
    soup = BeautifulSoup(content, "html.parser")

    all_title_tags = soup.find_all("div", attrs={"class": "header-new-background-image"})
    icon = all_title_tags[0]['content']
    if icon and '2a96cbd8b46e442fc41c2b86b821562f' not in icon:
        return [artist, icon]
    else:
        return ''

@eel.expose
def get_lyrics(artist, title):
    # Last.fm used to allow access to lyrics for each song, but now they don't, so we scrape from Genius.
    # I'm guessing they won't change any time soon since that's, like, their thing
    # INB4 sued by Genius like Google
    header = {'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'}
    try:
        response = requests.get('https://genius.com/'+artist.replace(' ','-').replace("'", '')+'-'+title.replace(' ','-').replace("'", '')+'-lyrics', headers=header)
    except requests.exceptions.ConnectionError:
        return None, None

    content = response.content
    soup = BeautifulSoup(content, "html.parser")

    all_title_tags = soup.find_all("div", attrs={"class": "lyrics"})

    return str(all_title_tags[0].getText())


@eel.expose
def get_info(artist, title):
    # Get the song summaries from Genius too because Last.fm's are terrible

    header = {'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'}
    try:
        response = requests.get('https://genius.com/'+artist.replace(' ','-').replace("'", '')+'-'+title.replace(' ','-').replace("'", '')+'-lyrics', headers=header)
    except requests.exceptions.ConnectionError:
        return None, None

    content = response.content
    soup = BeautifulSoup(content, "html.parser")

    info_body = soup.find_all("div", attrs={"class": "rich_text_formatting"})
    body = info_body[0].findChildren("p")

    final_string = ''
    for i in body:
        final_string += '<p>'+str(i)+'</p>'

    return str(final_string)


@eel.expose
def set_audio(percent):
    global volume
    volume = percent*.01
    pygame.mixer.music.set_volume(volume)


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
def search_saved(search_term):
    """Searches saved songs, used in the standard search function
    takes a term to search for and returns a list of matching artists, albums and songs"""
    search_term = search_term.lower()
    artists = []
    albums = []
    songs = []
    for artist in os.listdir('./Music/saved'):
        artist_matched = False;
        album_matched = False;
        if search_term in artist.lower() or artist.lower() == search_term and artist not in artists:
            artists.append(artist)
            artist_matched = True;
        for album in os.listdir('./Music/saved/'+artist):
            if search_term in album.lower() or album.lower() == search_term or artist_matched and album not in albums:
                albums.append(album)
                album_matched = True;
            for song in os.listdir('./Music/saved/'+artist+'/'+album):
                if search_term in song.lower() or song.lower() == search_term or artist_matched or album_matched and [song.rsplit('.',1)[0], artist] not in songs:
                    print(song.rsplit('.',1))
                    songs.append([song.rsplit('.',1)[0], artist])

    if artists or albums or songs:
        return [artists, albums, songs]
    else:
        return 0


@eel.expose
def reveal_files(url):
    folder_list = []
    file_list = []
    for item in os.listdir(url):
        if (os.path.isdir(os.path.join(url, item))):
            folder_list.append(item)
        else:
            if item.split('.')[-1] == 'ogg':
                file_list.append([item.split('.')[0], url.split('/')[-2]])
    return [folder_list, file_list]


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
                    + data['track']['album']['title'])
    except FileExistsError:
        pass

    shutil.copyfile("./Music/temp/" + data['track']['name'].lower() + ".ogg", "./Music/saved/" + data['track']['artist']['name']
            + "/" + data['track']['album']['title'] + '/' + data['track']['name'] + ".ogg")

    if os.path.isfile('./Music/saved/'+data['track']['artist']['name']+'/'+data['track']['album']['title']+'/'+data['track']['name']+'.mp3'):
        os.remove('./Music/saved/'+data['track']['artist']['name']+'/'+data['track']['album']['title']+'/'+data['track']['name']+'.mp3');
        return

    if sys.platform == 'win32':
        p = subprocess.Popen('ffmpeg -n -i "./Music/temp/'+data['track']['name']+'.ogg" -acodec libmp3lame "./Music/saved/'+data['track']['artist']['name']+'/'+data['track']['album']['title']+'/'+data['track']['name']+'.mp3')
        p.communicate()
    else:
        # p = subprocess.Popen(['./ffmpeg', '-i', "./Music/temp/"+play_queue[0][0].title()+'.ogg', '-acodec', 'libmp3lame', "./Music/saved/"+data['track']['artist']['name']+'/'+data['track']['album']['title']+'/'+play_queue[0][0].title()+'.mp3'])
        os.system('ffmpeg -n -i "./Music/temp/'+data['track']['name'].lower()+'.ogg" -acodec libmp3lame "./Music/saved/'+data['track']['artist']['name']+'/'+data['track']['album']['title']+'/'+data['track']['name']+'.mp3"')

   # shutil.copyfile("./Music/temp/" + play_queue[0][0] + ".mp3", "./Music/saved/" + play_queue[0][1].title()
   #                 + "/" + data['track']['album']['title'] + '/' + play_queue[0][0].title() + ".mp3")

    try:
        tags = ID3("./Music/saved/" + data['track']['artist']['name']
                    + "/" + data['track']['album']['title'] + '/' + data['track']['name'] + ".mp3")
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

    tags.save("./Music/saved/" + data['track']['artist']['name']
                    + "/" + data['track']['album']['title'] + '/' + data['track']['name'] + ".mp3", v2_version=3)

    eel.toggleEnabled("#dl", True)


@eel.expose
def get_search_results(search_title, search_artist):
    titles, links = youtube_scrape.scrape(search_title, search_artist)
    return_string = ""
    for i in range(len(titles)):
        return_string += "<div class='search_result' onclick='addToQueue(\""+links[i]+"\", \""+titles[i].title()+"\", \""+search_artist+"\")'>"+titles[i].title()+"</div>"
    return return_string


@eel.expose
def add_album(data, albumName):
    global play_queue
    album = ['%%%album%%%', albumName, []]
    for j, i in enumerate(data):
        add_to_queue(i['name'], i['artist']['name'], album)
    play_queue.append(album)
    print(play_queue)


@eel.expose
def add_to_queue(title, artist, album_container_array=None):
    global play_queue
    real_title, link = youtube_scrape.scrape(title, artist, True)
    real_title = real_title.split(' - ')[-1]
    if album_container_array != None:
        album_container_array[2].append([real_title, artist, link, "user", 'waiting'])
    else:
        play_queue.append([real_title, artist, link, "user", 'waiting'])
    print(play_queue)


@eel.expose
def delete_from_queue(index):
    global play_queue
    play_queue.pop(int(index)+1)
    print(play_queue)


@eel.expose
def toggle_radio(no_set=False):
    global radio
    if not no_set:
        if radio:
            radio = False
        else:
            radio = True
    return radio


@eel.expose
def get_charts(genre, choice):
    song_data = artist_finder.get_top_charts_by_genre(genre)
    titles = song_data[0]
    artists = song_data[1]

    title = titles[choice].replace("\n", "")
    artist = artists[choice].replace("\n", "")

    return [title, artist]


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
            song_title = i[0].translate({ord(c): "#" for c in "!@#$%^\"&*{};:/<>?\|`~=_"})
            if not os.path.exists("./Music/temp/"+song_title+'.ogg'):
                handle_song(i[1], i[0], play_queue[play_queue.index(i)])

        for file in os.listdir('./Music/temp/'):
            if file.rsplit('.', 1)[0] not in [i[0].translate({ord(c): "#" for c in "!@#$%^\"&*{};:/<>?\|`~=_"}) for i in play_queue]:
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
            try:
                email = parse_emails.readmail()
                if email != last_email:
                    last_email = email
                    song = last_email[0]
                    artist = last_email[1]
                    song, link = youtube_scrape.scrape(song, artist, True)
                    play_queue.append([song, artist, link, "email", 'waiting'])
            except:
                pass
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
            # If an album is upcoming, move the first track in the album's queue to the top of the main queue
            if play_queue[0][0] == '%%%album%%%':
                play_queue.insert(0, play_queue[0][2].pop(0))

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
                # If an album is upcoming, move the first track in the album's queue to the top of the main queue
                if play_queue[0][0] == '%%%album%%%':
                    play_queue.insert(0, play_queue[0][2].pop(0))

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

