import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static("public")); // ✅ برای نمایش index.html

const PORT = 3000;

// Test credentials endpoint
app.get("/test-credentials", async (req, res) => {
  try {
    const response = await axios.post(
      "https://rest.payamak-panel.com/api/SendSMS/GetCredit",
      {
        username: process.env.MP_USERNAME,
        password: process.env.MP_PASSWORD,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    res.json({ 
      success: true, 
      message: "Credentials are valid!",
      credit: response.data,
      credentials: {
        username: process.env.MP_USERNAME,
        from: process.env.MP_FROM,
        hasPassword: !!process.env.MP_PASSWORD
      }
    });
  } catch (err) {
    console.error("Credential Test Error:", err.response?.data || err.message);
    res.status(500).json({ 
      success: false, 
      error: "Invalid credentials or API error",
      details: err.response?.data || err.message
    });
  }
});

app.post("/send-sms", async (req, res) => {
  const { to, text } = req.body;

  if (!to || !text)
    return res.status(400).json({ error: "شماره و متن پیام الزامی است" });

  try {
    const response = await axios.post(
      "https://rest.payamak-panel.com/api/SendSMS/SendSMS",
      {
        username: process.env.MP_USERNAME,
        password: process.env.MP_PASSWORD,
        to,
        from: process.env.MP_FROM,
        text,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("SMS API Error:", err.response?.data || err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: err.response?.data || "No additional details available"
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
