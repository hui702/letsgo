"""Local Flask server for the Birthday Gesture Organ."""

import os
import random

from flask import Flask, jsonify, redirect, render_template, url_for


app = Flask(__name__)

# ============================================================
# 禮物頁內容：之後只要修改這一區，就能換掉收件人、情書與三個提示。
# ============================================================
BIRTHDAY_CONTENT = {
    "letter_paragraphs": [
        "生日快樂🎂！今天是你生日的正日喔!! 很抱歉真的沒辦法跟你在正日去吃個飯好好的慶祝一下🥲，但是正日該有的活動還是不能錯過ㄚㄚㄚ",
        "真的很開心你在環島的時候答應我，如果再早一點，我也不確定有沒有辦法好好的照顧你、接住你，就連現在有時也覺得我會不會沒有顧慮到你的心情，你上班的不開心，沒辦法好好的聽你分享、逗你開心，像這週連生日晚上都沒辦法跟你吃個飯，也會擔心你會不會多想，或是不開心?",
        "這也是我第一次以這個身分祝福你生日快樂!! 我覺得就像你祝福我報告順利裡面說的一樣(我會期待喔😗)，我們都還有好多需要努力學習的地方，你在裡面寫你需要努力常用言語跟行動表達，而我呢?也想要好好的學習理解你跟接住你的情緒，然後聽你分享生活的大小事，所以也做了這個驚喜給你，喜望你會喜歡",
        "這次呢!!有兩個驚喜，一個是我做的玩具，另一個呢~是我要送你的禮物，但是你要自己猜出來是甚麼東西，我底下有放三個線索給你，你要慢慢刮開它們，猜猜真正的禮物是什麼吧！",
    ],
    # 每個提示可以搭配一個 emoji，會顯示在刮刮樂卡片上。
    "gift_hints": [
        ("✨", "是一個容器"),
        ("🎀", "你以前有問過我這是幹嘛的"),
        ("🎁", "他在一個你看的到摸的到的地方"),
    ],
    "signature": "Savio",
}

def birthday_name():
    return os.getenv("BIRTHDAY_NAME", "Luana")


@app.get("/")
def index():
    """Main birthday-letter experience."""
    return render_template(
        "letter.html",
        birthday_name=birthday_name(),
        letter_paragraphs=BIRTHDAY_CONTENT["letter_paragraphs"],
        gift_hints=BIRTHDAY_CONTENT["gift_hints"],
        signature=BIRTHDAY_CONTENT["signature"],
    )


@app.get("/letter")
def letter():
    """Keep old bookmarks working while the letter becomes the homepage."""
    return redirect(url_for("index"))


@app.get("/music")
def music():
    """Compact gesture-organ surprise."""
    return render_template("index.html", birthday_name=birthday_name())

@app.get("/api/health")
def health():
    return jsonify(status="ok", service="gesture-organ")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
