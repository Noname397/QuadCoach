import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import EditableField from "./EditableField.jsx";
import LoadingOverlay from "./LoadingOverlay.jsx";
import TechStackEditor from "./TechStackEditor.jsx";

const RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function ProfileSetup({ editing = false, onCancel }) {
  const { user, updateProfile, parseResume, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user.profile?.name || "",
    profile_picture: null,
    resume: null,
  });
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [resumePreview, setResumePreview] = useState(null);

  const updateResumeItem = (section, index, field, value) => {
    setResumePreview((current) => ({
      ...current,
      details: {
        ...current.details,
        [section]: current.details[section].map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
  };

  const updateResumeSkill = (index, value) => {
    setResumePreview((current) => ({
      ...current,
      details: {
        ...current.details,
        skills: current.details.skills.map((skill, skillIndex) =>
          skillIndex === index ? value : skill,
        ),
      },
    }));
  };

  const addResumeSkill = () => {
    setResumePreview((current) => ({
      ...current,
      details: {
        ...current.details,
        skills: [...current.details.skills, ""],
      },
    }));
  };

  const removeResumeSkill = (index) => {
    setResumePreview((current) => ({
      ...current,
      details: {
        ...current.details,
        skills: current.details.skills.filter(
          (_, skillIndex) => skillIndex !== index,
        ),
      },
    }));
  };

  const updateTechStack = (section, entryIndex, techStack) => {
    setResumePreview((current) => ({
      ...current,
      details: {
        ...current.details,
        [section]: current.details[section].map((entry, index) =>
          index === entryIndex ? { ...entry, tech_stack: techStack } : entry,
        ),
      },
    }));
  };

  const updateResumeBullet = (section, index, bulletIndex, value) => {
    setResumePreview((current) => ({
      ...current,
      details: {
        ...current.details,
        [section]: current.details[section].map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                bullets: item.bullets.map((bullet, currentBulletIndex) =>
                  currentBulletIndex === bulletIndex ? value : bullet,
                ),
              }
            : item,
        ),
      },
    }));
  };

  const updateField = async (event) => {
    const input = event.target;
    const fieldName = input.name;
    if (input.type !== "file") {
      setForm((current) => ({
        ...current,
        [fieldName]: input.value,
      }));
      return;
    }

    const file = input.files?.[0] || null;
    if (
      file &&
      ((fieldName === "profile_picture" &&
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)) ||
        (fieldName === "resume" && !RESUME_TYPES.includes(file.type)) ||
        file.size > 5 * 1024 * 1024)
    ) {
      setError(
        fieldName === "resume"
          ? "Choose a PDF or DOCX CV up to 5 MB."
          : "Choose a JPEG, PNG, or WebP image up to 5 MB.",
      );
      input.value = "";
      return;
    }
    setError("");
    setForm((current) => ({ ...current, [fieldName]: file }));

    if (fieldName !== "resume") return;
    setResumePreview(null);
    if (!file) return;

    setParsing(true);
    try {
      const parsedResume = await parseResume(file);
      setResumePreview(parsedResume);
    } catch (parseError) {
      setError(parseError.message);
      setForm((current) => ({ ...current, resume: null }));
      input.value = "";
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = new FormData();
      body.append("name", form.name);
      if (form.profile_picture)
        body.append("profile_picture", form.profile_picture);
      if (form.resume) body.append("resume", form.resume);

      await updateProfile(body);
      navigate("/profile", { replace: true });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
          {editing ? "Profile settings" : "First things first"}
        </p>
        <h2 className="text-2xl font-semibold text-gray-900">
          {editing ? "Edit your profile" : "Set up your profile"}
        </h2>
        <p className="mt-2 text-gray-600">
          {editing
            ? "Keep your name, photo, and CV up to date."
            : "Add the details you want to use in QuadCoach"}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </span>
            <input
              name="name"
              required
              value={form.name}
              onChange={updateField}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              CV / resume{" "}
              <span className="font-normal text-gray-400">
                (optional, PDF or DOCX)
              </span>
            </span>
            <input
              name="resume"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={parsing}
              onChange={updateField}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {user.profile?.resume_filename && !form.resume && (
              <p className="mt-1 text-xs text-gray-500">
                Current CV: {user.profile.resume_filename}
              </p>
            )}
          </label>
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </span>
            <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {user.email}
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Profile picture{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </span>
            <input
              name="profile_picture"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={updateField}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {!editing && (
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Log out
              </button>
            )}
            {editing && (
              <button
                type="button"
                onClick={() => (onCancel ? onCancel() : navigate("/profile"))}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || parsing}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading || parsing
              ? parsing
                ? "Parsing..."
                : "Saving..."
              : editing
                ? "Save changes"
                : "Continue to QuadCoach"}
          </button>
        </div>
      </form>

      {resumePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-preview-title"
            className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                  Resume analysis
                </p>
                <h3
                  id="resume-preview-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  Resume details
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Review the details extracted from your CV.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResumePreview(null)}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="mb-3 text-sm font-medium text-gray-700">
                Selected file: {resumePreview.filename}
              </p>
              <div className="max-h-[55vh] space-y-5 overflow-auto pr-1">
                {resumePreview.details.headline && (
                  <p className="text-lg font-semibold text-gray-900">
                    {resumePreview.details.headline}
                  </p>
                )}
                {resumePreview.details.summary && (
                  <ResumeSection
                    title="Summary"
                    bullets={[resumePreview.details.summary]}
                  />
                )}
                <section>
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">
                    Skills
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {resumePreview.details.skills.map((skill, index) => (
                      <div
                        key={`skill-${index}`}
                        className="flex items-center rounded-full border border-gray-300 bg-white pl-3 pr-1 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                      >
                        <input
                          aria-label={`Skill ${index + 1}`}
                          type="text"
                          value={skill}
                          onChange={(event) =>
                            updateResumeSkill(index, event.target.value)
                          }
                          className="w-28 bg-transparent py-1.5 text-sm text-gray-900 outline-none"
                        />
                        <button
                          type="button"
                          aria-label={`Remove skill ${index + 1}`}
                          onClick={() => removeResumeSkill(index)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            fill="none"
                            className="h-4 w-4"
                          >
                            <path
                              d="m6 6 8 8M14 6l-8 8"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      aria-label="Add skill"
                      onClick={addResumeSkill}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-gray-400 text-gray-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-5 w-5"
                      >
                        <path
                          d="M10 4v12M4 10h12"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </section>
                {resumePreview.details.experience.length > 0 && (
                  <section>
                    <h4 className="mb-2 text-sm font-semibold text-gray-900">
                      Experience
                    </h4>
                    <div className="space-y-4">
                      {resumePreview.details.experience.map((role, index) => (
                        <div
                          key={`${role.company}-${role.title}-${index}`}
                          className="space-y-3 rounded-md border border-gray-200 p-4"
                        >
                          <EditableField
                            label="Job title"
                            value={role.title}
                            onChange={(value) =>
                              updateResumeItem("experience", index, "title", value)
                            }
                          />
                          <EditableField
                            label="Company"
                            value={role.company}
                            onChange={(value) =>
                              updateResumeItem("experience", index, "company", value)
                            }
                          />
                          <EditableField
                            label="Location"
                            value={role.location}
                            onChange={(value) =>
                              updateResumeItem("experience", index, "location", value)
                            }
                          />
                          <TechStackEditor
                            label={`Experience ${index + 1} tech stack`}
                            value={role.tech_stack || []}
                            onChange={(techStack) =>
                              updateTechStack("experience", index, techStack)
                            }
                          />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <EditableField
                              label="Start date"
                              value={role.start_date}
                              type="month"
                              onChange={(value) =>
                                updateResumeItem(
                                  "experience",
                                  index,
                                  "start_date",
                                  value,
                                )
                              }
                            />
                            <EditableField
                              label="End date"
                              value={role.end_date}
                              type="month"
                              allowPresent
                              onChange={(value) =>
                                updateResumeItem(
                                  "experience",
                                  index,
                                  "end_date",
                                  value,
                                )
                              }
                            />
                          </div>
                          {role.bullets.map((bullet, bulletIndex) => (
                            <EditableField
                              key={`experience-${index}-bullet-${bulletIndex}`}
                              label={`Description ${bulletIndex + 1}`}
                              multiline
                              value={bullet}
                              onChange={(value) =>
                                updateResumeBullet(
                                  "experience",
                                  index,
                                  bulletIndex,
                                  value,
                                )
                              }
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {resumePreview.details.education.length > 0 && (
                  <section>
                    <h4 className="mb-2 text-sm font-semibold text-gray-900">
                      Education
                    </h4>
                    <div className="space-y-4">
                      {resumePreview.details.education.map((item, index) => (
                        <div
                          key={`${item.institution}-${index}`}
                          className="space-y-3 rounded-md border border-gray-200 p-4"
                        >
                          <EditableField
                            label="Institution"
                            value={item.institution}
                            onChange={(value) =>
                              updateResumeItem("education", index, "institution", value)
                            }
                          />
                          <EditableField
                            label="Degree"
                            value={item.degree}
                            onChange={(value) =>
                              updateResumeItem("education", index, "degree", value)
                            }
                          />
                          <EditableField
                            label="Field of study"
                            value={item.field}
                            onChange={(value) =>
                              updateResumeItem("education", index, "field", value)
                            }
                          />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <EditableField
                              label="Start date"
                              value={item.start_date}
                              type="month"
                              onChange={(value) =>
                                updateResumeItem(
                                  "education",
                                  index,
                                  "start_date",
                                  value,
                                )
                              }
                            />
                            <EditableField
                              label="End date"
                              value={item.end_date}
                              type="month"
                              allowPresent
                              onChange={(value) =>
                                updateResumeItem(
                                  "education",
                                  index,
                                  "end_date",
                                  value,
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {resumePreview.details.projects.length > 0 && (
                  <section>
                    <h4 className="mb-2 text-sm font-semibold text-gray-900">
                      Projects
                    </h4>
                    <div className="space-y-3">
                      {resumePreview.details.projects.map((project, index) => (
                        <div
                          key={`${project.name}-${index}`}
                          className="space-y-3 rounded-md border border-gray-200 p-4"
                        >
                          <EditableField
                            label="Project name"
                            value={project.name}
                            onChange={(value) =>
                              updateResumeItem("projects", index, "name", value)
                            }
                          />
                          <EditableField
                            label="Description"
                            multiline
                            value={project.description}
                            onChange={(value) =>
                              updateResumeItem(
                                "projects",
                                index,
                                "description",
                                value,
                              )
                            }
                          />
                          <TechStackEditor
                            label={`Project ${index + 1} tech stack`}
                            value={project.tech_stack || []}
                            onChange={(techStack) =>
                              updateTechStack("projects", index, techStack)
                            }
                          />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <EditableField
                              label="Start date"
                              value={project.start_date}
                              type="month"
                              onChange={(value) =>
                                updateResumeItem(
                                  "projects",
                                  index,
                                  "start_date",
                                  value,
                                )
                              }
                            />
                            <EditableField
                              label="End date"
                              value={project.end_date}
                              type="month"
                              allowPresent
                              onChange={(value) =>
                                updateResumeItem(
                                  "projects",
                                  index,
                                  "end_date",
                                  value,
                                )
                              }
                            />
                          </div>
                          {project.bullets.map((bullet, bulletIndex) => (
                            <EditableField
                              key={`project-${index}-bullet-${bulletIndex}`}
                              label={`Description ${bulletIndex + 1}`}
                              multiline
                              value={bullet}
                              onChange={(value) =>
                                updateResumeBullet(
                                  "projects",
                                  index,
                                  bulletIndex,
                                  value,
                                )
                              }
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                <ResumeSection
                  title="Certifications"
                  bullets={resumePreview.details.certifications}
                />
                <ResumeSection
                  title="Languages"
                  bullets={resumePreview.details.languages}
                />
              </div>
            </div>
            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setResumePreview(null)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}
      <LoadingOverlay
        visible={parsing || loading}
        message={parsing ? "Parsing resume..." : "Saving profile..."}
      />
    </div>
  );
}

function ResumeSection({ title, bullets }) {
  if (!bullets.length) return null;

  return (
    <section>
      <h4 className="mb-2 text-sm font-semibold text-gray-900">{title}</h4>
      <BulletList items={bullets} />
    </section>
  );
}

function BulletList({ items }) {
  if (!items.length) return null;

  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-gray-700">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}