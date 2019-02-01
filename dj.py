import youtube_scrape
import parse_emails
import artist_finder

import time
import os
import math
import youtube_dl
import pygame
import mutagen.mp3

last_artist = ''
last_song = ''
play_queue = []
time_start = time.time()
time_to_end = math.inf
loops_without_music = 0


def handle_song(title):
    """Search YouTube for videos and download the best result"""
    video_url, duration = youtube_scrape.scrape(play_queue[0][0], play_queue[0][1])

    # If the function fails, return null
    if not duration:
        return duration

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
    pygame.mixer.music.play()


while True:
    # Get last email and set artist+song variables
    artist, song = parse_emails.readmail()

    if artist != last_artist or song != last_song:
        loops_without_music = 0
        last_artist, last_song = artist, song

        # If there's nothing in the queue, start playing the song; otherwise just append it to the queue
        if not play_queue:
            play_queue.append([song, artist])
            print("Queue updated:")
            print(play_queue)
            print("Now playing: "+artist+" - "+song)

            # Get song duration and download file
            time_to_end = handle_song(song)

            # If duration is Null, skip it
            if not time_to_end:
                last_artist, last_song = '', ''
                continue
            start_song(song)
            time_start = time.time()
        else:
            play_queue.append([song, artist])
            print("Queue updated:")
            print(play_queue)

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
            artist, song = play_queue[0][0], play_queue[0][1]
            print("Now playing: "+artist+" - "+song)
            time_to_end = handle_song(song)
            time_start = time.time()
            if not time_to_end:
                last_artist, last_song = '', ''
                continue
            start_song(song)
        else:
            time_to_end = math.inf

    # If nobody has submitted a play request in five loops, find a similar artist to the last played artist
    # And play a song in their top 20
    if loops_without_music > 2:
        loops_without_music = 0
        artist = artist_finder.find_similar_artist(last_played_artist)
        song = artist_finder.get_artist_song(artist)
        if not artist or not song:
            time_to_end = math.inf
            continue
        print("Now playing: " + artist + " - " + song)

        play_queue.append([song, artist])
        print("Queue updated:")
        print(play_queue)
        time_to_end = handle_song(song)
        if not time_to_end:
            time_to_end = math.inf
            play_queue.pop()
            continue
        start_song(song)
        time_start = time.time()

    if not play_queue:
        loops_without_music += 1

    time.sleep(2)
