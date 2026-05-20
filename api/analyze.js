<script>
const API_KEY = "AIzaSyAKK_58H5DZMT5YIxgOPXAg1ZAJk8580mg"; // 🔥 여기에 본인 키 넣기

async function analyze() {
  const userInput = document.getElementById("userInput").value;
  const resultBox = document.getElementById("result");

  if (!userInput) {
    alert("상황을 입력하세요!");
    return;
  }

  resultBox.innerText = "분석 중...";

  const prompt = `
너는 학교폭력 및 형사법 전문가다.

사용자가 입력한 상황을 분석해라.

반드시 JSON 형식으로만 답변해라.

{
  "school_violence": "O/X/애매",
  "reason": "판단 이유",
  "type": ["폭력 유형"],
  "criminal_issue": true,
  "law": ["관련 법"],
  "risk_level": 1,
  "advice": "행동 조언"
}

상황:
${userInput}
`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=" + API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        }),
      }
    );

    const data = await response.json();

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("응답 없음");
    }

    // 🔥 JSON 파싱 (AI가 가끔 이상하게 줄 수 있어서 처리)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(text);

    resultBox.innerText = formatResult(parsed);

  } catch (error) {
    console.error(error);
    resultBox.innerText = "오류 발생: " + error.message;
  }
}

// ✅ 결과 예쁘게 출력
function formatResult(data) {
  return `
📌 학교폭력 여부: ${data.school_violence}

📌 판단 이유:
${data.reason}

📌 폭력 유형:
${data.type.join(", ")}

📌 형사 문제 여부: ${data.criminal_issue ? "있음" : "없음"}

📌 관련 법:
${data.law.join(", ")}

📌 위험도: ${data.risk_level} 단계

📌 행동 조언:
${data.advice}
`;
}
</script>
