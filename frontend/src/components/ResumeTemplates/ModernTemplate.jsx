import React from "react";

const Section = ({ title, content }) => (
  <div className="mb-4">
    <h2 className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wide">
      {title}
    </h2>
    <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
      {content}
    </p>
  </div>
);

function ModernTemplate({ data }) {
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

        <div className="text-xs mt-2 space-y-1 text-gray-600">
          {email && <p>{email}</p>}
          {phone && <p>{phone}</p>}
          {linkedin && <p>{linkedin}</p>}
        </div>
      </div>

      {/* 2 COLUMN GRID */}
      <div className="grid grid-cols-3">

        {/* LEFT SIDEBAR */}
        <div className="col-span-1 bg-indigo-50 p-5">

          {/* TECH SKILLS TAG STYLE */}
          {technicalSkills && (
            <div className="mb-5">
              <h2 className="text-xs font-semibold text-indigo-700 mb-3 uppercase">
                Technical Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {technicalSkills.split(",").map((skill, index) => (
                  <span
                    key={index}
                    className="bg-indigo-200 text-indigo-800 px-2 py-1 rounded text-[10px]"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SOFT SKILLS */}
          {softSkills && (
            <div className="mb-5">
              <h2 className="text-xs font-semibold text-indigo-700 mb-3 uppercase">
                Soft Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {softSkills.split(",").map((skill, index) => (
                  <span
                    key={index}
                    className="bg-white border px-2 py-1 rounded text-[10px]"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
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
              title="Activities"
              content={activities}
            />
          )}

        </div>
      </div>
    </div>
  );
}

export default ModernTemplate;
