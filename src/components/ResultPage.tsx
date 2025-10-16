import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Checkbox, Space, message, Typography } from "antd";
import { DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph } from "docx";
import { motion } from "framer-motion";
import { useState } from "react";

const { Title } = Typography;

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const pages: string[] = state?.pages || [];
  const [selected, setSelected] = useState<boolean[]>(pages.map(() => true));

  const toggleSelect = (index: number) => {
    const newSelected = [...selected];
    newSelected[index] = !newSelected[index];
    setSelected(newSelected);
  };

  const downloadSelectedDocx = async () => {
    const doc = new Document({
      sections: [
        {
          children: pages
            .filter((_, i) => selected[i])
            .map((text) => text.split("\n").map((line) => new Paragraph(line)))
            .flat(),
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "SelectedPages.docx");
    message.success("Downloaded selected pages!");
  };

  const downloadAllDocx = async () => {
    const doc = new Document({
      sections: [
        {
          children: pages
            .map((text) => text.split("\n").map((line) => new Paragraph(line)))
            .flat(),
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "AllPages.docx");
    message.success("Downloaded all pages!");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ padding: 24 }}
      className="min-h-screen bg-gray-50 p-6 flex flex-col items-center"
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",

          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            margin: 0,
            padding: 0,
          }}
        >
          <Button
            type="dashed"
            onClick={() => navigate("/")}
            icon={<ArrowLeftOutlined />}
            size="large"
          />

          <Title level={2} style={{ margin: 0 }}>
            Extracted Pages
          </Title>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "flex-start",
            alignContent: "flex-start",
          }}
        >
          <Button
            type="primary"
            onClick={downloadSelectedDocx}
            icon={<DownloadOutlined />}
            size="large"
          >
            Download Selected
          </Button>
          <Button
            type="default"
            onClick={downloadAllDocx}
            icon={<DownloadOutlined />}
            size="large"
          >
            Download All
          </Button>
        </div>
      </div>

      <Space direction="vertical" style={{ width: "100%" }}>
        {pages.map((text, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              title={`Page ${i + 1}`}
              extra={
                <Checkbox
                  checked={selected[i]}
                  onChange={() => toggleSelect(i)}
                >
                  Select
                </Checkbox>
              }
              style={{
                marginBottom: 12,
                borderRadius: 12,
                boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
              }}
              bodyStyle={{
                maxHeight: 250,
                overflowY: "auto",
                whiteSpace: "pre-wrap", // preserves line breaks and spaces
                fontFamily: "monospace",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              <pre style={{ margin: 0 }}>{text || "No text found"}</pre>
            </Card>
          </motion.div>
        ))}
      </Space>
    </motion.div>
  );
}
