import React from "react";

const Section = ({ title, content }) => (
  <div className="mb-4">
    <h2 className="uppercase text-[10px] tracking-widest text-gray-500 mb-2">
      {title}
    </h2>
    <p className="text-gray-800 whitespace-pre-line text-[11px] leading-relaxed">
      {content}
    </p>
  </div>
);

function MinimalTemplate({ data }) {
  const {
    name = "",
    phone = "",
    email = "",
    linkedin = "",
    summary = "",
    technicalSkills = "",
    softSkills = "",
    additionalSkills = "",
    experience = "",
    education = "",
    projects = "",
    certifications = "",
    languages = "",
    interests = "",
    activities = "",
    academicExposure = "",
  } = data || {};

  return (
    <div className="w-[794px] min-h-[1123px] bg-white mx-auto text-[11px]">


      {/* HEADER */}
      <div className="text-center py-6 border-b">
        <h1 className="text-2xl font-semibold tracking-wide">
          {name || "Your Name"}
        </h1>
        <div className="text-xs text-gray-500 mt-2 space-y-1">
          {email && <p>{email}</p>}
          {phone && <p>{phone}</p>}
          {linkedin && <p>{linkedin}</p>}
        </div>
      </div>

      {/* 2 COLUMN GRID */}
      <div className="grid grid-cols-3">

        {/* LEFT SIDEBAR */}
        <div className="col-span-1 bg-gray-50 p-5">

          {technicalSkills && (
            <Section title="Technical Skills" content={technicalSkills} />
          )}

          {softSkills && (
            <Section title="Soft Skills" content={softSkills} />
          )}

          {certifications && (
            <Section title="Certifications" content={certifications} />
          )}

          {languages && (
            <Section title="Languages" content={languages} />
          )}

          {interests && (
            <Section title="Interests" content={interests} />
          )}

        </div>

        {/* RIGHT CONTENT */}
        <div className="col-span-2 p-6">

          {summary && (
            <Section title="Professional Summary" content={summary} />
          )}

          {education && (
            <Section title="Education" content={education} />
          )}

          {experience && (
            <Section title="Experience" content={experience} />
          )}

          {projects && (
            <Section title="Projects" content={projects} />
          )}

          {additionalSkills && (
            <Section title="Additional Skills" content={additionalSkills} />
          )}

          {academicExposure && (
            <Section title="Academic Exposure" content={academicExposure} />
          )}

          {activities && (
            <Section
              title="Curricular & Co-Curricular Activities"
              content={activities}
            />
          )}

        </div>

      </div>
    </div>
  );
}

export default MinimalTemplate;
