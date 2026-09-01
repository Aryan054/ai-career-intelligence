import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';

const CreateJob = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Basic Info
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('Demo Company');
  const [companyLogo, setCompanyLogo] = useState('');
  const [description, setDescription] = useState('');
  
  // Job Details
  const [category, setCategory] = useState('');
  const [locationCountry, setLocationCountry] = useState('India');
  const [locationState, setLocationState] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [officeAttendance, setOfficeAttendance] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [experienceCustomMin, setExperienceCustomMin] = useState('');
  const [experienceCustomMax, setExperienceCustomMax] = useState('');

  // Compensation
  const [salaryDisclosed, setSalaryDisclosed] = useState(false);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('INR');
  const [salaryPeriod, setSalaryPeriod] = useState('Per Year');

  // Education & Benefits
  const [educationLevel, setEducationLevel] = useState<string[]>([]);
  const [fieldOfStudy, setFieldOfStudy] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);

  // Application Details
  const [openings, setOpenings] = useState('');
  const [deadline, setDeadline] = useState('');
  const [applyMethod, setApplyMethod] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [applicationEmail, setApplicationEmail] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const fetchJob = async () => {
        try {
          const response = await apiClient.get(`/jobs/${id}`);
          const job = response.data;
          
          setTitle(job.title || '');
          setCompanyName(job.company_name || 'Demo Company');
          setDescription(job.description || '');
          
          if (job.job_details) {
            setCategory(job.job_details.category || '');
            setLocationCountry(job.job_details.location?.country || 'India');
            setLocationState(job.job_details.location?.state || '');
            setLocationCity(job.job_details.location?.city || '');
            setWorkMode(job.job_details.work_mode || '');
            setOfficeAttendance(job.job_details.office_attendance || '');
            setEmploymentType(job.job_details.employment_type || '');
            setExperienceLevel(job.job_details.experience_level || '');
            
            if (job.job_details.experience_custom) {
              setExperienceCustomMin(job.job_details.experience_custom.min?.toString() || '');
              setExperienceCustomMax(job.job_details.experience_custom.max?.toString() || '');
            }
            
            if (job.job_details.salary) {
              setSalaryDisclosed(job.job_details.salary.disclosed || false);
              setSalaryMin(job.job_details.salary.min?.toString() || '');
              setSalaryMax(job.job_details.salary.max?.toString() || '');
              setSalaryCurrency(job.job_details.salary.currency || 'INR');
              setSalaryPeriod(job.job_details.salary.period || 'Per Year');
            }
            
            setOpenings(job.job_details.openings?.toString() || '');
            setDeadline(job.job_details.deadline || '');
            setApplyMethod(job.job_details.apply_method || '');
            setApplicationEmail(job.job_details.application_email || '');
            setContactEmail(job.job_details.contact_email || '');
          }
          setExternalLink(job.external_link || '');
          
        } catch (err) {
          console.error('Failed to fetch job details');
          setError('Failed to fetch job details');
        }
      };
      fetchJob();
    }
  }, [id]);

  const handleSubmit = async (isDraft: boolean) => {
    setError('');
    
    // Basic validation
    const missingFields = [];
    if (!title) missingFields.push("Job Title");
    if (!companyName) missingFields.push("Company Name");
    if (!description) missingFields.push("Job Description");
    if (!category) missingFields.push("Job Category");
    if (!workMode) missingFields.push("Work Mode");
    if (!employmentType) missingFields.push("Employment Type");
    if (!experienceLevel) missingFields.push("Experience Required");
    if (!deadline) missingFields.push("Application Deadline");
    if (!applyMethod) missingFields.push("How Should Candidates Apply");
    if (!contactEmail) missingFields.push("Recruiter Contact Email");

    if (missingFields.length > 0) {
      if (!isDraft) {
        setError(`Please fill in all required fields (*) before publishing. Missing: ${missingFields.join(', ')}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        title,
        company_name: companyName,
        company_logo: companyLogo || null,
        description,
        category,
        location: { country: locationCountry, state: locationState, city: locationCity },
        work_mode: workMode,
        office_attendance: officeAttendance || null,
        employment_type: employmentType,
        experience_level: experienceLevel,
        experience_custom: experienceLevel === 'Custom Range' ? { min: Number(experienceCustomMin), max: Number(experienceCustomMax) } : null,
        salary_disclosed: salaryDisclosed,
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null,
        salary_currency: salaryCurrency,
        salary_period: salaryPeriod,
        skills: [],
        preferred_skills: [],
        responsibilities: [],
        qualifications: [],
        education_level: educationLevel,
        field_of_study: fieldOfStudy,
        benefits,
        openings: openings ? Number(openings) : null,
        deadline,
        apply_method: applyMethod,
        external_link: externalLink || null,
        application_email: applicationEmail || null,
        contact_email: contactEmail,
        is_draft: isDraft
      };

      if (id) {
        await apiClient.put(`/jobs/${id}`, payload);
        alert(isDraft ? 'Draft updated successfully!' : 'Job updated successfully!');
      } else {
        await apiClient.post('/jobs/', payload);
        alert(isDraft ? 'Draft saved successfully!' : 'Job published successfully!');
      }
      navigate('/recruiter');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{id ? 'Edit Job Posting' : 'Create Job Posting'}</h1>

        {error && <div className="bg-red-500/20 text-red-300 p-4 rounded mb-6">{error}</div>}

        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-purple-400 border-b border-gray-700 pb-2">1. Basic Information</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Job Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Python Developer" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Company Name *</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Job Description *</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white h-48"
                placeholder="Enter detailed job description here..."
              />
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-purple-400 border-b border-gray-700 pb-2">2. Job Details</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold mb-2">Job Category *</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                  <option value="">Select Category</option>
                  <option value="Software Development">Software Development</option>
                  <option value="Data Science & Analytics">Data Science & Analytics</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Location *</label>
                <input type="text" placeholder="City (e.g. Pune)" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mb-2" />
                <input type="text" placeholder="State (e.g. Maharashtra)" value={locationState} onChange={(e) => setLocationState(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold mb-2">Work Mode *</label>
                <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                  <option value="">Select</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              {workMode === 'Hybrid' && (
                <div>
                  <label className="block text-sm font-bold mb-2">Office Attendance</label>
                  <select value={officeAttendance} onChange={(e) => setOfficeAttendance(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                    <option value="">Select</option>
                    <option value="1 day per week">1 day per week</option>
                    <option value="2 days per week">2 days per week</option>
                    <option value="3 days per week">3 days per week</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Employment Type *</label>
                <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                  <option value="">Select</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Experience Required *</label>
                <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                  <option value="">Select</option>
                  <option value="Fresher">Fresher</option>
                  <option value="1-3 years">1-3 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                  <option value="Custom Range">Custom Range</option>
                </select>
                {experienceLevel === 'Custom Range' && (
                  <div className="flex gap-2 mt-2">
                    <input type="number" placeholder="Min" value={experienceCustomMin} onChange={(e) => setExperienceCustomMin(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                    <input type="number" placeholder="Max" value={experienceCustomMax} onChange={(e) => setExperienceCustomMax(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-purple-400 border-b border-gray-700 pb-2">3. Compensation</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Salary *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={salaryDisclosed} onChange={() => setSalaryDisclosed(true)} />
                  Salary Disclosed
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={!salaryDisclosed} onChange={() => setSalaryDisclosed(false)} />
                  Salary Not Disclosed
                </label>
              </div>
            </div>

            {salaryDisclosed && (
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm mb-1">Currency</label>
                  <select value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Min Salary</label>
                  <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Max Salary</label>
                  <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Period</label>
                  <select value={salaryPeriod} onChange={(e) => setSalaryPeriod(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                    <option value="Per Year">Per Year</option>
                    <option value="Per Month">Per Month</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Section 4 */}
          <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-purple-400 border-b border-gray-700 pb-2">4. Application Details</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold mb-2">Number of Openings</label>
                <input type="number" value={openings} onChange={(e) => setOpenings(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Application Deadline *</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">How Should Candidates Apply? *</label>
              <select value={applyMethod} onChange={(e) => setApplyMethod(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mb-2">
                <option value="">Select Method</option>
                <option value="PLATFORM">Apply Through Platform</option>
                <option value="EXTERNAL">External URL</option>
                <option value="EMAIL">Email Application</option>
              </select>

              {applyMethod === 'EXTERNAL' && (
                <input type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://..." className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
              )}
              {applyMethod === 'EMAIL' && (
                <input type="email" value={applicationEmail} onChange={(e) => setApplicationEmail(e.target.value)} placeholder="apply@company.com" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Recruiter Contact Email *</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="recruiter@company.com" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-700">
            <button onClick={() => handleSubmit(true)} disabled={loading} className="px-6 py-2 bg-gray-700 text-white rounded font-bold hover:bg-gray-600">
              {id ? 'Save Draft' : 'Save as Draft'}
            </button>
            <button onClick={() => handleSubmit(false)} disabled={loading} className="px-6 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-500 shadow-lg shadow-purple-500/20">
              {id ? 'Update Job' : 'Publish Job'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateJob;
