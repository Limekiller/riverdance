import requests
import random
from bs4 import BeautifulSoup


def find_similar_artist(artist_name):
    """Find a random similar artist based on input"""
    artist_name = artist_name.replace(" ", "+")
    header = {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'}

    # We use similar-artist.info
    try:
        response = requests.get("http://www.similar-artist.info/similarto/artist/"+artist_name, headers=header)
    except requests.exceptions.ConnectionError:
        return None

    content = response.content
    soup = BeautifulSoup(content, "html.parser")
    similar_artists = []
    all_title_tags = soup.find_all("div", attrs={"class": "discounted-item"})

    for div in all_title_tags[1:]:
        similar_artists.append(div.find('h1').contents[0].lower())

    # Return random artist from results
    # At first glance, it seems that artists further down the list are less popular (not confirmed)
    # if this IS true, you could adjust the likelihood of "finding new artists" or something by changing the range
    # of values the random choice is picked from
    final_artist = random.choice(similar_artists[:15])
    return final_artist


def get_artist_song(final_artist):
    """Get random song based on artist input"""
    header = {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'}

    try:
        response = requests.get("http://www.top50songs.info/artist.php?artist="+final_artist, headers=header)
    except:
        return None

    content = response.content
    soup = BeautifulSoup(content, "html.parser")
    songs = []
    all_title_tags = soup.find_all("li")

    for li in all_title_tags:
        try:
            songs.append(li.find("a")['title'].lower())
        except TypeError:
            return None

    # Choose song randomly from top 20
    # 20 because the likelihood of a song being a remix or some other strange version increases down the list
    # This isn't good for the user, as they probably don't want a remix, OR the program, as songs with weird titles
    # are more likely to cause problems.
    final_song = "*"
    while "*" in final_song:
        final_song = random.choice(songs[:20])
    return final_song
