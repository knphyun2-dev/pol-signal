// api/analyze.js (최신 gemini-2.0-flash 버전)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'POST 전송만 가능합니다.' });
  }

  const { sys, msg } = req.body;
  
  // 🔑 여기 따옴표 안에 본인의 구글 API 키(AIzaSy...)를 정확히 넣어주세요.
  const API_KEY = "AIzaSyDStpNyXD50kCO4pzHA7I6LyGGgLI0CHWo";

  try {
    const combinedPrompt = sys + "\n\n[데이터]\n" + msg;

    // 💡 핵심 수정: 모델 이름을 최신형인 gemini-2.0-flash 로 변경했습니다.
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: combinedPrompt }] }]
      })
    });

    const rawText = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({ message: "구글서버응답 실패: " + rawText });
    }

    const data = JSON.parse(rawText);
    const aiReply = data.candidates[0].content.parts[0].text;
    
    const cleanJson = aiReply.reply ? aiReply : aiReply.replace(/```json|```/g, "").trim();
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (err) {
    return res.status(500).json({ message: "시스템 오류 발생: " + err.message });
  }
}
