// api/analyze.js (오타 제로 초간결 버전)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'POST 전송만 가능합니다.' });
  }

  const { sys, msg } = req.body;
  
  // 🔑 오직 여기 따옴표 안에만 내 구글 API 키(AIzaSy...)를 정확히 넣으세요.
  // 앞뒤 큰따옴표("")는 절대 지우면 안 됩니다!
  const API_KEY = "AIzaSyAKK_58H5DZMT5YIxgOPXAg1ZAJk8580mg";

  try {
    const combinedPrompt = sys + "\n\n[데이터]\n" + msg;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY, {
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
    
    const cleanJson = aiReply.replace(/```json|```/g, "").trim();
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (err) {
    return res.status(500).json({ message: "시스템 오류 발생: " + err.message });
  }
}
