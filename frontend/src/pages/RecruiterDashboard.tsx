import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { Briefcase, Users, PlusCircle } from 'lucide-react';

const RecruiterDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [expandedResumeId, setExpandedResumeId] = useState<number | null>(null);

  useEffect(() => {
    // Fetch active jobs for the recruiter
    const fetchJobs = async () => {
      try {
        const response = await apiClient.get('/jobs/');
        setJobs(response.data);
      } catch (err) {
        console.error("Failed to fetch jobs");
      }
    };
    fetchJobs();
  }, []);



  const handleDeleteJob = async (jobId: number) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await apiClient.delete(`/jobs/${jobId}`);
        const response = await apiClient.get('/jobs/');
        setJobs(response.data);
      } catch (err) {
        console.error('Failed to delete job', err);
        alert('Failed to delete job.');
      }
    }
  };

  const handleViewMatches = async (jobId: number) => {
    setSelectedJobId(jobId);
    try {
      const res = await apiClient.get(`/applications/jobs/${jobId}`);
      setApplicants(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch applicants");
    }
  };

  const handleDownloadResume = async (resumeId: number, filename: string) => {
    try {
      const response = await apiClient.get(`/resumes/${resumeId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Failed to download resume", error);
      alert("Failed to download resume");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Recruiter Hub
            </h1>
            <p className="text-gray-400 mt-2">Managing as {user?.email}</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/recruiter/jobs/create')}
              className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 font-bold shadow-lg shadow-purple-500/30 transition transform hover:-translate-y-1"
            >
              + Create New Job
            </button>
            <button 
              onClick={logout}
              className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 transition border border-gray-700"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Active Jobs List */}
          <div className="col-span-1 md:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-2xl relative overflow-hidden group">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
              <Briefcase className="text-purple-400" />
              Active Job Postings
            </h2>
            
            {jobs.length === 0 ? (
              <p className="text-gray-500 italic">No active jobs. Create one to start matching candidates.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {jobs.map((job) => (
                  <div key={job.id} className="p-4 bg-gray-900 border border-gray-700 rounded-lg flex flex-col hover:border-purple-500/50 transition">
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <div className="flex items-center gap-4 text-gray-400 text-sm mt-3">
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                          {job.status}
                        </span>
                        <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
                          {job.match_count || 0} Matches
                        </span>
                        <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded-full border border-purple-500/30">
                          {job.applied_count || 0} Applied
                        </span>
                        {job.job_details?.work_mode && (
                          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full border border-gray-600">
                            {job.job_details.work_mode}
                          </span>
                        )}
                        {job.job_details?.employment_type && (
                          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full border border-gray-600">
                            {job.job_details.employment_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)} className="text-sm text-gray-400 hover:text-white">
                        {expandedJobId === job.id ? 'Hide Details' : 'View Details'}
                      </button>
                      <button onClick={() => navigate(`/recruiter/jobs/edit/${job.id}`)} className="text-sm text-blue-400 hover:text-blue-300">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteJob(job.id)} className="text-sm text-red-400 hover:text-red-300">
                        Delete
                      </button>
                      <button onClick={() => handleViewMatches(job.id)} className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 ml-2">
                        <Users size={16} />
                        Applicants
                      </button>
                    </div>
                  </div>
                  {expandedJobId === job.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-300">
                      <h4 className="font-semibold text-white mb-2">Job Description:</h4>
                      <p className="whitespace-pre-wrap mb-4">{job.description}</p>
                      {job.requirements?.skills && job.requirements.skills.length > 0 && (
                        <div className="mb-2">
                          <span className="font-semibold text-white">Skills: </span>
                          {job.requirements.skills.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-2xl flex flex-col gap-4">
            <h2 className="text-xl font-semibold mb-2">Actions</h2>
            
            <button 
              onClick={() => navigate('/recruiter/jobs/create')}
              className="flex items-center gap-3 w-full p-4 rounded-lg bg-pink-600/20 text-pink-400 hover:bg-pink-600/30 transition border border-pink-500/20"
            >
              <PlusCircle size={20} />
              Post New Job
            </button>
          </div>
          
        </div>
      </div>

      {/* Applicants Modal */}
      {selectedJobId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 border border-gray-700 relative">
            <button 
              onClick={() => setSelectedJobId(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              Close
            </button>
            <h2 className="text-2xl font-bold text-purple-400 mb-6">Applicants</h2>
            
            {applicants.length === 0 ? (
              <p className="text-gray-400">No applications yet.</p>
            ) : (
              <div className="space-y-4">
                {applicants.map((app) => (
                  <div key={app.application_id} className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{app.candidate_name}</h3>
                        <p className="text-gray-400">{app.current_title} • {app.experience_years} years experience</p>
                        {app.college_name && (
                          <p className="text-sm text-blue-300 mt-1">🏫 {app.college_name} {app.degree && `• ${app.degree}`}</p>
                        )}
                        {app.education && <p className="text-sm text-gray-400 mt-1">🎓 {app.education}</p>}
                        <div className="flex gap-4 items-center mt-2">
                          <p className="text-sm text-purple-300">{app.candidate_email}</p>
                          {app.resume_filename && app.resume_id && (
                            <button 
                              onClick={() => handleDownloadResume(app.resume_id, app.resume_filename)}
                              className="text-xs bg-purple-900/30 text-purple-300 hover:text-white hover:bg-purple-800/50 px-2 py-1 rounded border border-purple-500/30 flex items-center gap-1 transition cursor-pointer"
                              title="Download Resume"
                            >
                              ⬇️ {app.resume_filename}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full font-bold">
                        {app.overall_score.toFixed(2)}% Match
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <h4 className="text-green-400 font-semibold mb-2">Matched Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {app.matched_skills.map((s: string) => (
                            <span key={s} className="bg-green-500/10 text-green-300 px-2 py-1 rounded border border-green-500/20">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-red-400 font-semibold mb-2">Missing Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {app.missing_skills.map((s: string) => (
                            <span key={s} className="bg-red-500/10 text-red-300 px-2 py-1 rounded border border-red-500/20">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {app.resume_text && (
                      <div className="mt-4 border-t border-gray-700 pt-4">
                        <button 
                          onClick={() => setExpandedResumeId(expandedResumeId === app.application_id ? null : app.application_id)}
                          className="text-purple-400 text-sm hover:text-purple-300 transition"
                        >
                          {expandedResumeId === app.application_id ? 'Hide Resume Text' : 'View Full Resume Details'}
                        </button>
                        
                        {expandedResumeId === app.application_id && (
                          <div className="mt-3 p-4 bg-gray-950 rounded border border-gray-800 text-xs text-gray-400 whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {app.resume_text}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
