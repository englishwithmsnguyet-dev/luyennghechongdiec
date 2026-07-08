import re

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

correct_vn = "Cảm ơn tất cả mọi người đã đến tham dự buổi nói chuyện của tôi tối nay. Thật vui khi thấy có rất nhiều người trong khán giả. Đối với những ai chưa biết nhiều về PS Camping, trước tiên tôi xin giới thiệu một số thông tin cơ bản về công ty. Công ty được thành lập cách đây 25 năm. <span class='highlight-answer'>(1) Ban đầu, công ty hoạt động như một chuỗi cửa hàng bán lẻ chuyên kinh doanh các thiết bị cắm trại. Sau đó, cách đây 20 năm, công ty đã mua một số khu cắm trại nhỏ tại Vương quốc Anh và bắt đầu cung cấp các kỳ nghỉ cắm trại.</span> Công ty phát triển rất nhanh và trong 15 năm qua đã cung cấp các kỳ nghỉ tại khu vực châu Âu lục địa. Nếu đặt một kỳ nghỉ cắm trại với chúng tôi, quý khách sẽ có thể lựa chọn trong số hơn 300 khu cắm trại. Tại Ý, hiện nay chúng tôi có khoảng 64 khu cắm trại thuộc sở hữu của công ty hoặc được quyền sử dụng độc quyền. <span class='highlight-answer'>(2) Pháp là quốc gia có số lượng khu cắm trại nhiều nhất của chúng tôi, và hiện tại chúng tôi đang triển khai một dự án mở rộng sang Thụy Sĩ.</span> Chúng tôi cũng có một số khu cắm trại ở miền Bắc Tây Ban Nha, đặc biệt là tại vùng núi Picos de Europa. Tất cả các khu cắm trại này ở Tây Ban Nha đã được nâng cấp đáng kể so với tiêu chuẩn 3 sao ban đầu. Chúng tôi tin rằng các kỳ nghỉ của mình mang đến những tiện nghi tuyệt vời cho cả gia đình. Những bậc phụ huynh muốn con mình được tham gia các hoạt động trong suốt cả ngày hoặc một phần trong ngày có thể tận dụng các chương trình dành cho trẻ em. Những hoạt động này được tổ chức bởi đội ngũ nhân viên nhiệt tình và có chuyên môn cao của chúng tôi. <span class='highlight-answer'>(3) Mỗi ngày bắt đầu bằng một trận đấu thể thao – có thể là bóng đá hoặc bóng chuyền – tiếp theo là một giờ hoạt động kịch nghệ dành cho mọi người.</span> Hoạt động này có thể bao gồm hát, nhảy múa, diễn câm hoặc các hoạt động khác. Vào buổi chiều, mỗi ngày trong tuần sẽ có một hoạt động nghệ thuật khác nhau như cuộc thi thiết kế áp phích hoặc làm mô hình. Hơn nữa, các khu cắm trại của chúng tôi thực sự thân thiện với trẻ em. Với mục tiêu đó, chúng tôi áp dụng quy định không gây tiếng ồn vào buổi tối. Các hoạt động buổi tối dành cho trẻ em thường kết thúc lúc 9 giờ 30 phút hoặc đôi khi là 10 giờ. Từ 10 giờ 30 phút trở đi, du khách được yêu cầu giữ yên lặng tại những khu vực có lều trại. Chúng tôi mong muốn mọi thứ diễn ra suôn sẻ trong kỳ nghỉ với PS Camping, nhưng nếu có sự cố xảy ra, chúng tôi cũng muốn tất cả khách hàng đều được bảo hiểm. <span class='highlight-answer'>(4) Nếu quý khách chưa có gói bảo hiểm hằng năm của riêng mình, quý khách sẽ cần mua gói bảo hiểm chi phí thấp do chúng tôi cung cấp. Chúng tôi yêu cầu việc này phải được thực hiện ngay khi quý khách đặt chỗ cho kỳ nghỉ.</span> Có rất nhiều lợi ích khi lựa chọn PS Camping và giới thiệu công ty cho người khác. Với tư cách là khách hàng thường xuyên, quý khách sẽ luôn được cập nhật các chương trình ưu đãi đặc biệt. Bạn bè của quý khách có thể được giảm 10% chi phí kỳ nghỉ hoặc được sử dụng lều cao cấp với mức giá của lều tiêu chuẩn. <span class='highlight-answer'>(5) Đổi lại, chúng tôi sẽ gửi cho quý khách một món quà cảm ơn mà quý khách có thể lựa chọn từ danh sách các sản phẩm chất lượng cao.</span>"

wrong_vn_pattern = r'transcriptVN:\s*"Hôm nay chúng tôi có mặt cùng nhà sinh vật học Paul Hart[^"]+"'

# We only want to replace it within Day 09 Practice 01. But let's check how many times the wrong text is there in data.js.
wrong_vns = re.findall(wrong_vn_pattern, content)
print(f"Found {len(wrong_vns)} instances of the wrong transcriptVN.")

# Actually, the wrong transcriptVN is for Paul Hart, which SHOULD be there for Day 08 Practice 01!
# If we replace ALL of them, we break Day 08 Practice 01.
# So we must ONLY replace it within Day 09 Practice 01 section.

# Let's split by "title: \"PRACTICE 01\"," and "audioSrc: \"day09_practice05.mp3\","
parts = content.split('audioSrc: "day09_practice05.mp3",')
if len(parts) == 2:
    # part 1 is day09 practice 01.
    sub_parts = parts[1].split('audioSrc: "day09_practice06.mp3",')
    if len(sub_parts) == 2:
        practice01_content = sub_parts[0]
        practice01_content = re.sub(wrong_vn_pattern, f'transcriptVN: "{correct_vn}"', practice01_content)
        new_content = parts[0] + 'audioSrc: "day09_practice05.mp3",' + practice01_content + 'audioSrc: "day09_practice06.mp3",' + sub_parts[1]
        
        with open('data.js', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully updated Day 09 Practice 01 transcriptVN")
    else:
        print("Error: Could not find Practice 06 separator.")
else:
    print("Error: Could not find Practice 05 separator.")
