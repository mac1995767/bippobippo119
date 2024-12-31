from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
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
print(f"접속 중: {url}")
driver.get(url)

# 페이지 로딩 확인 및 대기
try:
    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )
except Exception as e:
    print("페이지 로딩 실패:", e)
    driver.quit()

# 뉴스 제목과 상대 링크 추출
print("뉴스 항목 탐색 시작")
articles = []
try:
    news_items = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a.JtKRv"))
    )
    print(f"탐색된 뉴스 항목 수: {len(news_items)}")

    for item in news_items:
        title = item.text
        relative_link = item.get_attribute("href")
        full_link = f"https://news.google.com{relative_link[1:]}" if relative_link.startswith("./") else relative_link

        # 각 기사 페이지 접속
        try:
            driver.get(full_link)
            WebDriverWait(driver, 10).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )

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
except Exception as e:
    print("뉴스 항목 탐색 중 오류:", e)

# 드라이버 종료
driver.quit()

print("크롤링 완료! 결과:")
print(articles)
