import React, { useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import axios from "axios";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser, FaCode, FaGraduationCap,
  FaMagic, FaDownload, FaCertificate
} from "react-icons/fa";

import ModernTemplate from "./ResumeTemplates/ModernTemplate";
import ClassicTemplate from "./ResumeTemplates/ClassicTemplate";
import MinimalTemplate from "./ResumeTemplates/MinimalTemplate";

const API = process.env.REACT_APP_API_URL || '';

const resumeSchema = z.object({
  name: z.string().min(2, "Name is required (min 2 characters)"),
  email: z.email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  linkedin: z.url("Invalid URL").optional().or(z.literal("")),
  summary: z.string().min(20, "Summary should be at least 20 characters"),
  technicalSkills: z.string().min(5, "Skills are required"),
  softSkills: z.string().optional(),
  additionalSkills: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().min(5, "Education is required"),
  projects: z.string().optional(),
  certifications: z.string().optional(),
  languages: z.string().optional(),
  interests: z.string().optional(),
  activities: z.string().optional(),
  academicExposure: z.string().optional(),
});

function Builder() {
  const resumeRef = useRef();
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [activeTab, setActiveTab] = useState("personal");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      name: "", email: "", phone: "", linkedin: "", summary: "",
      technicalSkills: "", softSkills: "", additionalSkills: "",
      experience: "", education: "", projects: "", certifications: "",
      languages: "", interests: "", activities: "", academicExposure: "",
    },
    mode: "onChange"
  });

  const formData = watch();

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

      setValue("summary", res.data.summary, { shouldValidate: true });
      toast.success("AI Summary Generated!");
    } catch (err) {
      toast.error("Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const element = resumeRef.current;
    const options = {
      margin: 0,
      filename: `${formData.name || 'Resume'}_${selectedTemplate}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" },
    };
    html2pdf().set(options).from(element).save();
  };

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case "classic": return <ClassicTemplate data={formData} />;
      case "minimal": return <MinimalTemplate data={formData} />;
      default: return <ModernTemplate data={formData} />;
    }
  };

  const hasSectionErrors = (sectionId) => {
    const sectionFields = {
      personal: ['name', 'email', 'phone', 'linkedin'],
      professional: ['summary', 'experience'],
      skills: ['technicalSkills', 'softSkills', 'additionalSkills', 'languages'],
      academic: ['education', 'projects'],
      other: ['certifications', 'academicExposure', 'activities', 'interests']
    };
    return sectionFields[sectionId]?.some(field => errors[field]);
  };

  const onSubmit = () => {
    downloadPDF();
    toast.success("Download started!");
  };

  const onInvalid = (errors) => {
    toast.error("Please fix the errors in the form before downloading.");
  };

  const sections = [
    { id: 'personal', label: 'Personal Information', icon: <FaUser /> },
    { id: 'professional', label: 'Career Summary', icon: <FaMagic /> },
    { id: 'skills', label: 'Skills & Languages', icon: <FaCode /> },
    { id: 'academic', label: 'Education & Projects', icon: <FaGraduationCap /> },
    { id: 'other', label: 'Others', icon: <FaCertificate /> },
  ];

  return (
    <div className="max-w-[1600px] mx-auto -mt-6">
      <div className="flex flex-col lg:flex-row gap-6 relative">

        {/* LEFT SIDE: MULTI-STEP FORM */}
        <div className="w-full lg:w-[450px] shrink-0">
          <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-indigo-50/50 overflow-hidden flex flex-col max-h-[calc(100vh-120px)] sticky top-24">

            {/* Form Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaMagic className="animate-pulse" /> Resume AI Builder
              </h2>
              <p className="text-indigo-100 text-xs mt-1">Fill in the details to see magic happen</p>
            </div>

            {/* Section Tabs */}
            <div className="flex overflow-x-auto bg-indigo-50/30 p-2 custom-scrollbar border-b border-indigo-100">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-300 relative
                    ${activeTab === s.id
                      ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100'
                      : 'text-gray-500 hover:bg-white/50'}`}
                >
                  {s.icon} {s.label}
                  {hasSectionErrors(s.id) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">

                <AnimatePresence mode="wait">
                  {activeTab === 'personal' && (
                    <motion.div
                      key="personal"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <SectionTitle title="Basic Details" />
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Full Name (Required)</label>
                        <input {...register("name")} placeholder="Type your name..." className={`input-v2 ${errors.name ? 'border-red-400 focus:ring-red-100' : ''}`} />
                        {errors.name && <p className="text-red-500 text-[10px] mt-1 italic">{errors.name.message}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone (Required)</label>
                          <input {...register("phone")} placeholder="+1..." className={`input-v2 ${errors.phone ? 'border-red-400 focus:ring-red-100' : ''}`} />
                          {errors.phone && <p className="text-red-500 text-[10px] mt-1 italic">{errors.phone.message}</p>}
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email (Required)</label>
                          <input {...register("email")} placeholder="name@email.com" className={`input-v2 ${errors.email ? 'border-red-400 focus:ring-red-100' : ''}`} />
                          {errors.email && <p className="text-red-500 text-[10px] mt-1 italic">{errors.email.message}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">LinkedIn URL</label>
                        <input {...register("linkedin")} placeholder="https://linkedin.com/in/..." className="input-v2" />
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'professional' && (
                    <motion.div
                      key="professional"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center bg-purple-50 p-2 rounded-lg">
                        <SectionTitle title="Professional Summary (Required)" />
                        <button
                          type="button"
                          onClick={generateSummary}
                          disabled={loading}
                          className="bg-purple-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-purple-700 shadow-sm transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                        >
                          <FaMagic className="text-[10px]" /> {loading ? "Generating..." : "AI AUTO-FILL"}
                        </button>
                      </div>
                      <textarea
                        {...register("summary")}
                        rows={6}
                        placeholder="E.g. Dedicated professional with 5+ years of experience in market research..."
                        className={`input-v2 resize-none ${errors.summary ? 'border-red-400 focus:ring-red-100' : ''}`}
                      />
                      {errors.summary && <p className="text-red-500 text-[10px] italic">{errors.summary.message}</p>}

                      <SectionTitle title="Professional Experience" />
                      <textarea {...register("experience")} rows={5} placeholder="E.g. Senior Manager at Global Inc. (2018-2023)... Accomplished X by doing Y..." className="input-v2 resize-none" />
                    </motion.div>
                  )}

                  {activeTab === 'skills' && (
                    <motion.div
                      key="skills"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <SectionTitle title="Key Skills (Required)" />
                      <textarea {...register("technicalSkills")} rows={3} placeholder="E.g. Project Management, Java, Accounting, Sales, Graphic Design..." className={`input-v2 resize-none ${errors.technicalSkills ? 'border-red-400 focus:ring-red-100' : ''}`} />
                      {errors.technicalSkills && <p className="text-red-500 text-[10px] italic">{errors.technicalSkills.message}</p>}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <SectionTitle title="Soft Skills" />
                          <textarea {...register("softSkills")} rows={3} placeholder="Communication..." className="input-v2 resize-none" />
                        </div>
                        <div>
                          <SectionTitle title="Other Skills" />
                          <textarea {...register("additionalSkills")} rows={3} placeholder="Tools..." className="input-v2 resize-none" />
                        </div>
                      </div>

                      <SectionTitle title="Languages Known" />
                      <input {...register("languages")} placeholder="E.g. English (Fluent), French (Intermediate)..." className="input-v2" />
                    </motion.div>
                  )}

                  {activeTab === 'academic' && (
                    <motion.div
                      key="academic"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <SectionTitle title="Education (Required)" />
                      <textarea {...register("education")} rows={4} placeholder="E.g. Bachelor of Commerce - University of Toronto (2018-2022)" className={`input-v2 resize-none ${errors.education ? 'border-red-400 focus:ring-red-100' : ''}`} />
                      {errors.education && <p className="text-red-500 text-[10px] italic">{errors.education.message}</p>}

                      <SectionTitle title="Projects" />
                      <textarea {...register("projects")} rows={4} placeholder="Major projects and your role..." className="input-v2 resize-none" />
                    </motion.div>
                  )}

                  {activeTab === 'other' && (
                    <motion.div
                      key="other"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <SectionTitle title="Certifications" />
                      <textarea {...register("certifications")} rows={3} placeholder="E.g. PMP, CPR, CFA, Adobe Certified..." className="input-v2 resize-none" />

                      <SectionTitle title="Academic / Professional Exposure" />
                      <textarea {...register("academicExposure")} rows={3} placeholder="E.g. Conferences, Research papers, Workshops, Seminars..." className="input-v2 resize-none" />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <SectionTitle title="Activities" />
                          <textarea {...register("activities")} rows={2} placeholder="Volunteering..." className="input-v2 resize-none" />
                        </div>
                        <div>
                          <SectionTitle title="Interests" />
                          <textarea {...register("interests")} rows={2} placeholder="Chess, Hiking..." className="input-v2 resize-none" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Form Footer Controls */}
            <div className="p-4 bg-gray-50 border-t border-indigo-100 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">Template:</span>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="flex-1 bg-white border border-indigo-200 rounded-lg p-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="modern">Modern Professional</option>
                  <option value="classic">Classic Traditional</option>
                  <option value="minimal">Minimalist Sleek</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleSubmit(onSubmit, onInvalid)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <FaDownload className="text-sm" /> Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE PREVIEW */}
        <div className="flex-1 flex justify-center">
          <div className="sticky top-24 w-full flex flex-col items-center">
            <div className="mb-4 flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-indigo-50">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-widest">Live Preview</span>
            </div>

            <div className="bg-white p-4 lg:p-10 shadow-2xl rounded-sm border border-gray-100 transform scale-[0.85] origin-top md:scale-[0.9] lg:scale-100 mt-2">
              <div ref={resumeRef} className="bg-white w-[794px] min-h-[1123px] shadow-sm">
                {renderTemplate()}
              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx="true">{`
        .input-v2 {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          background: #ffffff;
        }
        .input-v2:focus {
          outline: none;
          border-color: #6366f1;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .input-v2::placeholder {
          color: #94a3b8;
          font-size: 13px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

const SectionTitle = ({ title }) => (
  <h3 className="text-sm font-bold text-indigo-900/80 flex items-center gap-2 mb-1">
    {title}
  </h3>
);

export default Builder;
