import React from "react";

const Section = ({ title, content }) => (
  <div className="mb-4">
    <h2 className="text-xs font-bold uppercase border-b pb-1 mb-2">
      {title}
    </h2>
    <p className="text-xs whitespace-pre-line leading-relaxed">
      {content}
    </p>
  </div>
);

function ClassicTemplate({ data }) {
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
        <h1 className="text-2xl font-bold uppercase tracking-wide">
          {name || "Your Name"}
        </h1>
        <div className="text-xs mt-2 space-y-1">
          {email && <p>{email}</p>}
          {phone && <p>{phone}</p>}
          {linkedin && <p>{linkedin}</p>}
        </div>
      </div>

      {/* 2 COLUMN SECTION */}
      <div className="grid grid-cols-3">

        {/* LEFT SIDEBAR */}
        <div className="col-span-1 bg-gray-100 p-5">

          {technicalSkills && (
            <Section title="TECHNICAL SKILLS" content={technicalSkills} />
          )}

          {softSkills && (
            <Section title="SOFT SKILLS" content={softSkills} />
          )}

          {certifications && (
            <Section title="CERTIFICATIONS" content={certifications} />
          )}

          {languages && (
            <Section title="LANGUAGES" content={languages} />
          )}

          {interests && (
            <Section title="INTERESTS" content={interests} />
          )}

        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="col-span-2 p-6">

          {summary && (
            <Section title="PROFESSIONAL SUMMARY" content={summary} />
          )}

          {education && (
            <Section title="EDUCATION" content={education} />
          )}

          {experience && (
            <Section title="EXPERIENCE" content={experience} />
          )}

          {projects && (
            <Section title="PROJECTS" content={projects} />
          )}

          {additionalSkills && (
            <Section title="ADDITIONAL SKILLS" content={additionalSkills} />
          )}

          {academicExposure && (
            <Section title="ACADEMIC EXPOSURE" content={academicExposure} />
          )}

          {activities && (
            <Section title="ACTIVITIES" content={activities} />
          )}

        </div>

      </div>
    </div>
  );
}

export default ClassicTemplate;
