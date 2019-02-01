import eel
import youtube_scrape


@eel.expose
def get_search_results(search_title, search_artist):
    titles, links = youtube_scrape.scrape(search_title, search_artist)
    return_string = ""
    for i in range(len(titles)):
        return_string += "<div class='search_result' onclick='addToQueue(\"https://youtube.com"+links[i]+"\", \""+titles[i].title()+"\")'>"+titles[i].title()+"</div>"
    return return_string


@eel.expose
def add_to_queue(title, link):
    play_queue.append([title, link])

@eel.expose
def get_queue():
    return play_queue

options = {
    'mode': 'custom',
    'args': ['C:\\Users\\bryod\\node_modules\electron\dist\electron.exe', '.']
}
play_queue = []

eel.init('web')
eel.start('main.html')
