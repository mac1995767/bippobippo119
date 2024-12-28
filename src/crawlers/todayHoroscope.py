from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time

# ChromeDriver 설정
options = webdriver.ChromeOptions()
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Google 뉴스 페이지 접속
query = "오늘의운세"
url = f"https://news.google.com/search?q={query}&hl=ko&gl=KR&ceid=KR:ko"
driver.get(url)

# 페이지 로딩 시간 대기
time.sleep(3)

# 뉴스 제목과 상대 링크 추출
articles = []
news_items = driver.find_elements(By.CSS_SELECTOR, "a.JtKRv")  # 뉴스 항목 선택자
for item in news_items:
    title = item.text
    relative_link = item.get_attribute("href")
    full_link = f"https://news.google.com{relative_link[1:]}" if relative_link.startswith("./") else relative_link

    # 각 기사 페이지 접속
    try:
        driver.get(full_link)
        time.sleep(3)  # 페이지 로딩 대기

        # BeautifulSoup으로 기사 내용 파싱
        article_soup = BeautifulSoup(driver.page_source, "html.parser")
        title_meta = article_soup.find("meta", {"name": "title"})["content"] if article_soup.find("meta", {"name": "title"}) else title
        content_paragraphs = article_soup.find_all("p")
        content = "\n".join(p.get_text(separator="\n") for p in content_paragraphs)

        articles.append({"title": title_meta, "link": full_link, "content": content})
        print({"title": title_meta, "link": full_link, "content": content[:100]})

    except Exception as e:
        print(f"Error accessing {full_link}: {e}")
    finally:
        driver.back()
        time.sleep(1)

# 드라이버 종료
driver.quit()