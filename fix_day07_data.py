import re

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix numbering 6-10 to 1-5 for questionVN in Day 7
for old, new in [
    ('questionVN: "6.\tNgười đọc', 'questionVN: "1. Người đọc'),
    ('questionVN: "7.\tTại sao', 'questionVN: "2. Tại sao'),
    ('questionVN: "8.\tThông tin nào', 'questionVN: "3. Thông tin nào'),
    ('questionVN: "9.\tNgười đọc', 'questionVN: "4. Người đọc'),
    ('questionVN: "10.\tChương trình', 'questionVN: "5. Chương trình'),
    ('questionVN: "6.\tJohn đã làm gì trong chương trình truyền hình gần đây nhất của mình?\u2028A. Lái xe từ Bắc Cực đến Nam Cực"', 'questionVN: "1. John đã làm gì trong chương trình truyền hình gần đây nhất của mình?"'),
    ('questionVN: "7.\tTại sao John từ bỏ', 'questionVN: "2. Tại sao John từ bỏ'),
    ('questionVN: "8.\tLoạt phim truyền hình', 'questionVN: "3. Loạt phim truyền hình'),
    ('questionVN: "9.\tTại sao John muốn', 'questionVN: "4. Tại sao John muốn'),
    ('questionVN: "10.\tCho đến nay', 'questionVN: "5. Cho đến nay'),
]:
    content = content.replace(old, new)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed data.js VN questions")
