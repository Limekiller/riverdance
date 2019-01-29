import eel
import youtube_scrape

@eel.expose
def get_search_results(search_term):
    print(youtube_scrape.scrape(search_term))

options = {
    'mode':'custom',
    'args': ['C:\\Users\\bryod\\node_modules\electron\dist\electron.exe', '.']
}

eel.init('web')
eel.start('main.html')
