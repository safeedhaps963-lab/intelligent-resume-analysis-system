import React, { useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import axios from "axios";
import toast from "react-hot-toast";

import ModernTemplate from "./ResumeTemplates/ModernTemplate";
import ClassicTemplate from "./ResumeTemplates/ClassicTemplate";
import MinimalTemplate from "./ResumeTemplates/MinimalTemplate";

const API = process.env.REACT_APP_API_URL || '';

function Builder() {
  const resumeRef = useRef();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    summary: "",
    technicalSkills: "",
    softSkills: "",
    additionalSkills: "",
    experience: "",
    education: "",
    projects: "",
    certifications: "",
    languages: "",
    interests: "",
    activities: "",
    academicExposure: "",
  });

  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 🔥 AI AUTO SUMMARY FUNCTION
  const generateSummary = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");

      const payload = {
        jobTitle: formData.name || '',
        skills: formData.technicalSkills || '',
        experience: formData.experience || ''
      };

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.post(`${API}/api/ai/generate-summary`, payload, { headers });

      setFormData((prev) => ({
        ...prev,
        summary: res.data.summary,
      }));

      toast.success("AI Summary Generated ✅");
    } catch (err) {
      console.log(err);
      toast.error("Failed to generate summary ❌");
    } finally {
      setLoading(false);
    }
  };

  // ✅ A4 DOWNLOAD FUNCTION
  const downloadPDF = () => {
    const element = resumeRef.current;

    const options = {
      margin: 0,
      filename: "My_Resume.pdf",
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: {
        unit: "px",
        format: [794, 1123],
        orientation: "portrait",
      },
    };

    html2pdf().set(options).from(element).save();
  };

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case "classic":
        return <ClassicTemplate data={formData} />;
      case "minimal":
        return <MinimalTemplate data={formData} />;
      default:
        return <ModernTemplate data={formData} />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

      {/* LEFT SIDE */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Resume Builder</h2>

        <input type="text" name="name" placeholder="Name" className="input mb-3" value={formData.name} onChange={handleChange}/>
        <input type="text" name="phone" placeholder="Phone" className="input mb-3" value={formData.phone} onChange={handleChange}/>
        <input type="email" name="email" placeholder="Email" className="input mb-3" value={formData.email} onChange={handleChange}/>
        <input type="text" name="linkedin" placeholder="LinkedIn URL" className="input mb-3" value={formData.linkedin} onChange={handleChange}/>

        {/* SUMMARY */}
        <textarea
          name="summary"
          value={formData.summary}
          placeholder="Professional Summary"
          className="input mb-3"
          onChange={handleChange}
        />

        {/* 🔥 AI BUTTON */}
        <button
          onClick={generateSummary}
          disabled={loading}
          className="bg-purple-600 text-white px-3 py-2 rounded mb-4 hover:bg-purple-700"
        >
          {loading ? "Generating..." : "AI Generate Summary"}
        </button>

        <textarea name="technicalSkills" placeholder="Technical Skills" className="input mb-3" value={formData.technicalSkills} onChange={handleChange}/>
        <textarea name="softSkills" placeholder="Soft Skills" className="input mb-3" value={formData.softSkills} onChange={handleChange}/>
        <textarea name="additionalSkills" placeholder="Additional Skills" className="input mb-3" value={formData.additionalSkills} onChange={handleChange}/>
        <textarea name="education" placeholder="Education" className="input mb-3" value={formData.education} onChange={handleChange}/>
        <textarea name="projects" placeholder="Projects" className="input mb-3" value={formData.projects} onChange={handleChange}/>
        <textarea name="certifications" placeholder="Certifications" className="input mb-3" value={formData.certifications} onChange={handleChange}/>
        <textarea name="academicExposure" placeholder="Academic Exposure" className="input mb-3" value={formData.academicExposure} onChange={handleChange}/>
        <textarea name="activities" placeholder="Activities" className="input mb-3" value={formData.activities} onChange={handleChange}/>
        <textarea name="interests" placeholder="Interests" className="input mb-3" value={formData.interests} onChange={handleChange}/>
        <textarea name="languages" placeholder="Languages Known" className="input mb-3" value={formData.languages} onChange={handleChange}/>

        {/* TEMPLATE SELECT */}
        <div className="mt-4">
          <label className="font-semibold">Choose Template:</label>
          <select
            className="input mt-2"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        <button
          onClick={downloadPDF}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Download PDF
        </button>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex justify-center items-start p-4">
        <div ref={resumeRef} className="w-full max-w-[794px]">
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
}

export default Builder;
