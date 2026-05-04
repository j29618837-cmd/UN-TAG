
// 1. 選取目標 (用 ID 抓取)
const title = document.getElementById('title');
const btn = document.getElementById('myBtn');

// 2. 監聽事件 (當按鈕被 click 時)
btn.addEventListener('click', function() {
    // 3. 執行動作 (修改文字與 CSS)
    title.innerText = "標題已經被 JS 改變了！";
    title.style.color = "red";
    console.log("按鈕被按下了！"); // 這會顯示在瀏覽器的 F12 控制台
});