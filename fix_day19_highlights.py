import re

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace transcriptEN and transcriptVN for Day 19 questions 1 to 8.

day19_updates = [
    (
        1,
        "Hi there It’s Paul. I’ve been to the gallery to get some ideas for my latest project and I got some good ones you know, for shapes and so on now I need to think about using colours, and patterns. I might go back another day and look at paintings. <span class='highlight-answer'>There are some on the first floor of indoor scenes with vases and bowls in them like the ones I looked at on display today.</span> Oh, and there’s a new sculpture exhibition on, but I didn’t get a chance to see it.",
        "Xin chào, tôi là Paul. Tôi vừa đến phòng trưng bày để tìm ý tưởng cho dự án mới nhất của mình và tôi đã có một số ý tưởng hay, ví dụ về hình dạng này nọ. Giờ tôi cần suy nghĩ thêm về màu sắc và họa tiết. Có thể một ngày nào đó tôi sẽ quay lại và xem tranh. <span class='highlight-answer'>Ở tầng một có một số bức tranh vẽ cảnh trong nhà với những chiếc bình và bát, giống như những cái tôi vừa xem trưng bày hôm nay.</span> Ồ, và còn có một triển lãm điêu khắc mới, nhưng tôi chưa kịp xem."
    ),
    (
        2,
        "There's a new service available at Jeff Dean’s Gym from today. Consultant Jenny Law will offer gym members complete dietary analysis and fitness assessment. <span class='highlight-answer'>If you book before 5th November you will get a 33% discount and pay only 20 instead of the usual 30 pounds.</span> Make sure you’re fit enough for the next century Consult the experts at Jeff Dean’s Gym. Join today!",
        "Từ hôm nay, có dịch vụ mới tại phòng tập Jeff Dean. Cố vấn Jenny Law sẽ cung cấp cho hội viên phân tích chế độ ăn uống và đánh giá thể chất. <span class='highlight-answer'>Nếu bạn đặt trước ngày 5 tháng 11, bạn sẽ được giảm 33% và chỉ phải trả 20 bảng thay vì 30 bảng như bình thường.</span> Hãy chắc chắn rằng bạn đủ khỏe mạnh cho thế kỷ tới. Hãy tham khảo chuyên gia tại Jeff Dean’s Gym. Tham gia ngay hôm nay!"
    ),
    (
        3,
        "You have reached the Gas Hotline. If you have a complaint concerning our service you may speak to our customer care line by dialling 3 after the tone. <span class='highlight-answer'>If you would like to arrange for regular servicing to any of your gas appliances you may speak to our service engineers by dialling 4 after the tone.</span> Our emergency service can be contacted by dialling 5 after the tone.",
        "Bạn đã gọi đến đường dây nóng Gas. Nếu bạn có khiếu nại liên quan đến dịch vụ của chúng tôi, bạn có thể gọi bộ phận chăm sóc khách hàng bằng cách bấm phím 3 sau tín hiệu. <span class='highlight-answer'>Nếu bạn muốn đặt lịch bảo trì định kỳ cho các thiết bị gas, hãy liên hệ với kỹ sư dịch vụ bằng cách bấm phím 4 sau tín hiệu.</span> Dịch vụ khẩn cấp có thể liên hệ qua phím 5."
    ),
    (
        4,
        "Just one last word, ladies and gentlemen. You probably know how dangerous rabies can be. Just one bite from an affected animal can kill if medical help is not available immediately. <span class='highlight-answer'>We've been free from rabies in Britain for over 75 years but it is still quite common here. So don't be tempted to take animals home with you.</span> They may be infected, and you can be sent to prison for illegally importing animals.",
        "Một lời cuối cùng, thưa quý vị. Chắc các bạn biết bệnh dại nguy hiểm thế nào. Chỉ một vết cắn từ con vật nhiễm bệnh có thể gây chết người nếu không có sự trợ giúp y tế ngay. <span class='highlight-answer'>Ở Anh, chúng tôi đã không có bệnh dại suốt hơn 75 năm, nhưng nó vẫn còn khá phổ biến ở đây. Vì vậy, đừng mang động vật về nước.</span> Chúng có thể bị nhiễm bệnh, và bạn có thể bị bỏ tù vì nhập khẩu động vật trái phép."
    ),
    (
        5,
        "And now for the week's weather. The week will start out very wet. Indeed, with thunder and lightning in some areas. This will last through to Wednesday. <span class='highlight-answer'>Thursday will be dry but dull, but the clouds will clear during the night, bringing us a bright end to the week - something to make up for all that bad weather...</span>",
        "Và bây giờ là dự báo thời tiết tuần này. Tuần sẽ bắt đầu với mưa nhiều, có sấm sét ở một số nơi. Tình trạng này sẽ kéo dài đến thứ Tư. <span class='highlight-answer'>Thứ Năm sẽ khô ráo nhưng ảm đạm, nhưng bầu trời sẽ quang vào ban đêm, mang lại một ngày cuối tuần đầy nắng – phần nào bù đắp cho thời tiết xấu trước đó...</span>"
    ),
    (
        6,
        "...and yes, I would agree that computers have made a dramatic difference in the workplace. However, computers in the home have their disadvantages especially for children. <span class='highlight-answer'>In a school setting they're fine, I think, but letting them spend too much time with computer games certainly doesn't help children learn to communicate.</span> As to whether children have to think while they're playing on the computer. I’d say they do.",
        "…vâng, tôi đồng ý rằng máy tính đã tạo ra sự thay đổi lớn trong công việc. Tuy nhiên, máy tính ở nhà có nhiều bất lợi, đặc biệt là đối với trẻ em. <span class='highlight-answer'>Ở trường học thì không sao, nhưng để trẻ chơi game quá nhiều chắc chắn không giúp trẻ học cách giao tiếp.</span> Còn việc liệu trẻ có phải suy nghĩ khi chơi game trên máy tính không, tôi nghĩ là có."
    ),
    (
        7,
        "And finally, on a lighter note. When college lecturer, Chris Pearse, told Jamie his pet bloodhound to fetch his slippers, he expected the dog to go upstairs for the new pair he had got for Christmas. In fact, the dog disappeared for two hours. The legendary nose of the bloodhound had led it four miles across town to the Council tip where Jamie retrieved his master's old slippers, which had been thrown away and brought them home. <span class='highlight-answer'>Mr Pearse said, \"I didn't expect it, but I can't complain when he's only done exactly what I asked...\"</span>",
        "Và cuối cùng, một câu chuyện vui. Khi giảng viên Chris Pearse bảo con chó săn Jamie đi lấy dép, ông nghĩ nó sẽ chạy lên lầu lấy đôi dép mới ông nhận dịp Giáng sinh. Nhưng con chó biến mất hai giờ. Với chiếc mũi nhạy, nó đã chạy bốn dặm đến bãi rác thành phố, tìm được đôi dép cũ của chủ đã vứt đi rồi mang về. <span class='highlight-answer'>Ông Pearse nói: “Tôi không ngờ, nhưng tôi không thể phàn nàn khi nó chỉ làm đúng những gì tôi bảo…”</span>"
    ),
    (
        8,
        "\"We are sorry to announce that both the 9.15 from Crewe and the 10:30 to London Euston have been cancelled due to staff shortages. Passengers for Birmingham International and Oxford should cross the bridge to platform four where a relief train will shortly arrive. Passengers for Reeding can also take this train but must change at Oxford. <span class='highlight-answer'>Passengers for London and Heathrow airport should go immediately to the booking hall on platform one where a coach has been arranged.</span>",
        "“Chúng tôi xin thông báo chuyến 9h15 từ Crewe và chuyến 10h30 đi London Euston đã bị hủy do thiếu nhân viên. Hành khách đi Birmingham International và Oxford vui lòng sang sân ga số 4, nơi sẽ có tàu thay thế sắp đến. Hành khách đi Reading cũng có thể đi chuyến này nhưng phải đổi tàu ở Oxford. <span class='highlight-answer'>Hành khách đi London và sân bay Heathrow hãy đến ngay phòng đặt vé ở sân ga số 1, nơi đã bố trí xe buýt.</span>"
    )
]

# Split data.js around Day 19
parts = content.split('audioSrc: "day19_practice07.mp3",')
if len(parts) == 2:
    sub_parts = parts[1].split('audioSrc: "day20_practice08.mp3",')
    if len(sub_parts) == 2:
        day19_text = sub_parts[0]
        for q_id, en_val, vn_val in day19_updates:
            # replace transcriptEN
            day19_text = re.sub(
                rf'(id:\s*{q_id},.*?transcriptEN:\s*")[^"]+(")',
                lambda m: m.group(1) + en_val + m.group(2),
                day19_text,
                flags=re.DOTALL
            )
            # replace transcriptVN
            day19_text = re.sub(
                rf'(id:\s*{q_id},.*?transcriptVN:\s*")[^"]+(")',
                lambda m: m.group(1) + vn_val + m.group(2),
                day19_text,
                flags=re.DOTALL
            )
        new_content = parts[0] + 'audioSrc: "day19_practice07.mp3",' + day19_text + 'audioSrc: "day20_practice08.mp3",' + sub_parts[1]
        with open('data.js', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully updated Day 19 highlights in data.js")
    else:
        print("Error separating Day 20")
else:
    print("Error separating Day 19")
