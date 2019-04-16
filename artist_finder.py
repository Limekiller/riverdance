import requests
import random
from bs4 import BeautifulSoup


def find_similar_artist(artist_name):
    """Find a random similar artist based on input"""

    r = requests.get("http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist="+artist_name+"&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json")
    return random.choice(r.json()['similarartists']['artist'])['name']


def get_artist_song(final_artist):
    """Get random song based on artist input"""

    r = requests.get("http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist="+final_artist+"&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json")
    return r.json()['toptracks']['track'][random.randint(0, 20)]['name']


def get_top_charts_by_genre(genre):

    if genre == 'Indie':
        genre = 'triple-a'
    else:
        genre +='-songs'

    genre = genre.replace("&amp;", "-")
    genre = genre.replace("/", "-")
    r = requests.get("https://www.billboard.com/charts/"+genre)
    soup = BeautifulSoup(r.content, 'html.parser')

    titles = soup.find_all('span', class_="chart-list-item__title-text", text=True)
    title_list = []
    artists = soup.find_all('div', class_="chart-list-item__artist")
    artist_list = []

    for title in titles:
        title_list.append(title.text)
    for artist in artists:
        if artist.text:
            artist_list.append(artist.text)
        else:
            artist_list.append(artist.find('a').text)

    return [title_list, artist_list]
