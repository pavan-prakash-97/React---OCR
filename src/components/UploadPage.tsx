import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Button,
  Progress,
  Typography,
  Card,
  Select,
  Alert,
} from "antd";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js";

const { Dragger } = Upload;
const { Title, Text } = Typography;
const { Option } = Select;

export default function UploadPage() {
  const [file, setFile] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("eng");
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const navigate = useNavigate();

  const showAlert = (
    type: "success" | "error" | "warning",
    messageText: string
  ) => {
    setAlert({ type, message: messageText });
    setTimeout(() => setAlert(null), 5000); // Auto-hide after 5s
  };

  const extractTextFromImage = async (image: File) => {
    try {
      const { data } = await Tesseract.recognize(image, language, {
        logger: (m) => {
          if (m.status === "recognizing text")
            setProgress(Math.floor(m.progress * 100));
        },
      });
      return [data.text.trim()];
    } catch (err) {
      console.error("Image OCR Error:", err);
      showAlert("error", "Failed to extract text from image.");
      return [""];
    }
  };

  const extractTextFromPDF = async (pdfFile: File) => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join("\n");
        pages.push(pageText);
        setProgress(Math.floor((i / pdf.numPages) * 100));
      }

      return pages;
    } catch (err) {
      console.error("PDF OCR Error:", err);
      showAlert("error", "Failed to extract text from PDF.");
      return [];
    }
  };

  const handleExtract = async () => {
    if (!file) {
      showAlert("warning", "Please upload a file first!");
      return;
    }

    const actualFile = file.originFileObj || file;
    setLoading(true);
    setProgress(0);

    try {
      let pages: string[] = [];

      if (actualFile.type.includes("image")) {
        pages = await extractTextFromImage(actualFile);
      } else if (actualFile.type === "application/pdf") {
        pages = await extractTextFromPDF(actualFile);
      } else {
        showAlert("error", "Only image or PDF files are supported!");
        return;
      }

      if (!pages.some((t) => t.trim())) {
        showAlert("warning", "No readable text found in the file!");
        return;
      }

      showAlert("success", "Text extraction successful!");
      navigate("/result", { state: { pages } });
    } catch (error) {
      console.error(error);
      showAlert("error", "Something went wrong during extraction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingBlock: 150,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          style={{
            width: 500,
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            borderRadius: 16,
          }}
        >
          <Title level={2}>OCR Text Extractor</Title>
          <Text type="secondary">Upload an image or PDF to extract text</Text>

          {alert && (
            <Alert
              style={{ marginTop: 20 }}
              message={alert.message}
              type={alert.type}
              showIcon
            />
          )}

          <div style={{ marginTop: 20, marginBottom: 10 }}>
            <Select
              value={language}
              onChange={(value) => setLanguage(value)}
              style={{ width: "100%" }}
              size="large"
            >
              <Option value="eng">English</Option>
              <Option value="hin">Hindi</Option>
              <Option value="tam">Tamil</Option>
              <Option value="tel">Telugu</Option>
              <Option value="kan">Kannada</Option>
            </Select>
          </div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Dragger
              accept="image/*,application/pdf"
              multiple={false}
              showUploadList={true}
              beforeUpload={(file) => {
                setFile(file);
                return false;
              }}
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: "#1677ff" }} />
              </p>
              <p className="ant-upload-text">Click or drag file to this area</p>
              <p className="ant-upload-hint">
                Supports single file upload — image or PDF only
              </p>
            </Dragger>
          </motion.div>

          {loading && (
            <div style={{ marginTop: 20 }}>
              <Progress
                percent={progress}
                status={progress < 100 ? "active" : "success"}
              />
            </div>
          )}

          <motion.div whileHover={{ scale: 1.05 }} style={{ marginTop: 30 }}>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleExtract}
              loading={loading}
              block
              size="large"
            >
              {loading ? "Extracting..." : "Upload & Extract"}
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
