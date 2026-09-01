import React, { useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Upload, FileText, CheckCircle, Target, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';

const CandidateDashboard = () => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);
  
  const [matches, setMatches] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('NO_RESUME'); // NO_RESUME, SUCCESS, LOADING
  const [topScore, setTopScore] = useState<number>(0);
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set());
  
  // New States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  
  // Profile State
  const [profile, setProfile] = useState<{full_name: string | null, skills: string[], experience_years: number, current_title: string | null, education: string | null, college_name: string | null, degree: string | null, latest_resume_filename: string | null}>({full_name: '', skills: [], experience_years: 0, current_title: '', education: '', college_name: '', degree: '', latest_resume_filename: null});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  
  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/profiles/me');
      setProfile({
        full_name: res.data.full_name || '',
        skills: res.data.skills || [],
        experience_years: res.data.experience_years || 0,
        current_title: res.data.current_title || '',
        education: res.data.education || '',
        college_name: res.data.college_name || '',
        degree: res.data.degree || '',
        latest_resume_filename: res.data.latest_resume_filename || null
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiClient.put('/profiles/me', profile);
      setProfileMessage('Profile saved successfully!');
      setTimeout(() => setProfileMessage(''), 3000);
      fetchMatches(); // Refresh matches with new profile
    } catch (err) {
      console.error(err);
      setProfileMessage('Error saving profile');
    } finally {
      setSavingProfile(false);
    }
  };
  
  // Fetch matches on load
  const fetchMatches = async () => {
    try {
      const response = await apiClient.get('/resumes/me/matches');
      setStatus(response.data.status);
      setMatches(response.data.matches || []);
      
      if (response.data.matches && response.data.matches.length > 0) {
        setTopScore(response.data.matches[0].overall_score);
      }
    } catch (err) {
      console.error("Failed to fetch matches", err);
    }
  };

  // Fetch applied jobs
  const fetchAppliedJobs = async () => {
    try {
      const response = await apiClient.get('/applications/me');
      setAppliedJobs(new Set(response.data));
    } catch (err) {
      console.error("Failed to fetch applied jobs", err);
    }
  };

  React.useEffect(() => {
    fetchMatches();
    fetchProfile();
    fetchAppliedJobs();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setMessage('Uploading...');
      const response = await apiClient.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage('Resume uploaded successfully! Analyzing skills (this takes a few seconds)...');
      
      // Wait for background parsing and AI embedding to finish
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const res = await apiClient.get('/resumes/me/matches');
          if (res.data.status === 'SUCCESS' || attempts > 15) {
            clearInterval(poll);
            setStatus(res.data.status);
            setMatches(res.data.matches || []);
            if (res.data.matches && res.data.matches.length > 0) {
              setTopScore(res.data.matches[0].overall_score);
            }
            fetchProfile(); // Refresh profile to get AI populated skills
            setMessage('Analysis complete! Matches updated.');
            setTimeout(() => setMessage(''), 4000);
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setMessage('Failed to upload resume.');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApply = async (job: any) => {
    if (job.external_link) {
      window.open(job.external_link, '_blank');
      return;
    }
    
    setApplying(true);
    try {
      await apiClient.post('/applications/', { job_id: job.job_id });
      alert("Successfully applied to this job!");
      setAppliedJobs(prev => new Set(prev).add(job.job_id));
    } catch (err: any) {
      if (err.response?.data?.detail === "Already applied") {
        alert("You have already applied to this job.");
        setAppliedJobs(prev => new Set(prev).add(job.job_id));
      } else {
        alert("Failed to apply. Please try again.");
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              AI Career Intelligence
            </h1>
            <p className="text-gray-400 mt-2">Welcome back, {user?.email || 'Candidate'}</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded transition border ${activeTab === 'dashboard' ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded transition border ${activeTab === 'profile' ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
            >
              My Profile
            </button>
            <button 
              onClick={logout}
              className="px-4 py-2 rounded bg-gray-800 hover:bg-red-900/50 hover:border-red-500 transition border border-gray-700 ml-4"
            >
              Sign Out
            </button>
          </div>
        </header>

        {activeTab === 'profile' ? (
          <div className="max-w-2xl bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Candidate Profile</h2>
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={profile.full_name || ''}
                  onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Current Title</label>
                <input 
                  type="text" 
                  value={profile.current_title || ''}
                  onChange={e => setProfile({ ...profile, current_title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Years of Experience</label>
                <input 
                  type="number" 
                  value={profile.experience_years}
                  onChange={e => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Skills (comma separated)</label>
                <textarea 
                  value={profile.skills.join(', ')}
                  onChange={e => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500 h-32"
                  placeholder="Python, React, TypeScript..."
                />
                <p className="text-xs text-gray-500 mt-2">When you upload a resume, the AI will automatically extract and append your skills here.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">College Name</label>
                <input 
                  type="text" 
                  value={profile.college_name || ''}
                  onChange={e => setProfile({ ...profile, college_name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Stanford University"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Degree</label>
                <input 
                  type="text" 
                  value={profile.degree || ''}
                  onChange={e => setProfile({ ...profile, degree: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. B.S. Computer Science"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Education Details</label>
                <textarea 
                  value={profile.education || ''}
                  onChange={e => setProfile({ ...profile, education: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500 min-h-[80px]"
                  placeholder="e.g. B.S. Computer Science, University of Technology"
                />
              </div>
              
              <button 
                type="submit"
                disabled={savingProfile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
              {profileMessage && <p className="text-center text-emerald-400 text-sm">{profileMessage}</p>}
            </form>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Stats / Profile Score */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 group-hover:opacity-20 transition duration-700"></div>
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <Target className="text-emerald-400" />
                Profile Strength
              </h2>
              {status === 'NO_RESUME' ? (
                <div>
                  <div className="flex items-end gap-4">
                    <span className="text-6xl font-bold text-gray-500">0%</span>
                  </div>
                  <p className="text-gray-400 mt-4 max-w-md">
                    Upload your resume to see your profile strength and get matched with top tech jobs!
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-end gap-4">
                    <span className="text-6xl font-bold text-white">{topScore > 0 ? topScore.toFixed(2) : 0}%</span>
                    <span className="text-emerald-400 text-sm font-medium mb-2">Based on top match</span>
                  </div>
                  <p className="text-gray-400 mt-4 max-w-md">
                    Your profile has been analyzed. Check your job matches below to see detailed skill compatibility.
                  </p>
                </div>
              )}
            </div>
            
            {/* Job Matches List */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-2xl">
              <h2 className="text-xl font-semibold mb-4">
                {status === 'NO_RESUME' ? 'Available Jobs' : `Your Top Matches (${matches.length})`}
              </h2>
              {matches.length === 0 ? (
                <p className="text-gray-400">No jobs found yet. Check back later!</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {matches.map((match: any) => (
                    <div 
                      key={match.job_id} 
                      className="p-4 bg-gray-900 border border-gray-700 rounded-lg transition group flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-blue-400">{match.title}</h3>
                        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-semibold">
                          {match.overall_score.toFixed(2)}% Match
                        </span>
                      </div>
                      
                      <div className="bg-gray-800 p-3 rounded text-xs text-gray-400 mb-3">
                        <span className="font-semibold text-gray-300 mb-1 block">Why you match:</span>
                        {match.explanation.map((exp: string, i: number) => (
                          <div key={i} className="mb-1">• {exp}</div>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-2">
                        <button 
                          onClick={() => setExpandedJobId(expandedJobId === match.job_id ? null : match.job_id)} 
                          className="text-sm text-gray-400 hover:text-white"
                        >
                          {expandedJobId === match.job_id ? 'Hide Details' : 'View Details'}
                        </button>
                        <button 
                          onClick={() => setSelectedJob(match)} 
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          View Full Analysis & Apply
                        </button>
                      </div>
                      
                      {expandedJobId === match.job_id && (
                        <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-300">
                          <h4 className="font-semibold text-white mb-2">Job Description:</h4>
                          <p className="whitespace-pre-wrap mb-4">{match.description}</p>
                          {match.requirements?.skills && match.requirements.skills.length > 0 && (
                            <div className="mb-2">
                              <span className="font-semibold text-white">Skills: </span>
                              {match.requirements.skills.join(', ')}
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

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-2xl flex flex-col gap-4">
            <h2 className="text-xl font-semibold mb-2">Actions</h2>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.doc,.docx,.txt"
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-3 w-full p-4 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition border border-blue-500/20 disabled:opacity-50"
            >
              <Upload size={20} />
              {uploading ? 'Uploading...' : 'Upload New Resume'}
            </button>
            
            {profile.latest_resume_filename && (
              <p className="text-xs text-center text-gray-400">
                Active Resume: <span className="text-gray-300 font-semibold">{profile.latest_resume_filename}</span>
              </p>
            )}
            
            {message && <p className="text-sm text-center text-blue-300 mt-2">{message}</p>}

            <button 
              onClick={() => {
                setMessage("Refreshing matches...");
                fetchMatches();
                setTimeout(() => setMessage(''), 2000);
              }}
              className="flex items-center gap-3 w-full p-4 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition border border-emerald-500/20"
            >
              <FileText size={20} />
              Refresh Matches
            </button>
          </div>
          
        </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-8 max-w-2xl w-full border border-gray-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-3xl font-bold text-blue-400 mb-2">{selectedJob.title}</h2>
            <div className="inline-block bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full font-semibold mb-6">
              {selectedJob.overall_score.toFixed(2)}% AI Match
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Match Analysis</h3>
            
            {/* Detailed Skills Analysis */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-900 border border-emerald-900/50 p-4 rounded-lg">
                <h4 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle size={16} /> Matched Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.matched_skills && selectedJob.matched_skills.length > 0 ? (
                    selectedJob.matched_skills.map((skill: string) => (
                      <span key={skill} className="px-2 py-1 bg-emerald-500/10 text-emerald-300 text-xs rounded border border-emerald-500/20">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-xs">None</span>
                  )}
                </div>
              </div>
              <div className="bg-gray-900 border border-red-900/50 p-4 rounded-lg">
                <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle size={16} /> Missing Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.missing_skills && selectedJob.missing_skills.length > 0 ? (
                    selectedJob.missing_skills.map((skill: string) => (
                      <span key={skill} className="px-2 py-1 bg-red-500/10 text-red-300 text-xs rounded border border-red-500/20">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-xs">None</span>
                  )}
                </div>
              </div>
            </div>

            {selectedJob.job_details && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-900 p-4 rounded-lg border border-gray-700">
                <div>
                  <h5 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Work Mode</h5>
                  <p className="text-sm font-semibold">{selectedJob.job_details.work_mode || 'N/A'}</p>
                </div>
                <div>
                  <h5 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Employment Type</h5>
                  <p className="text-sm font-semibold">{selectedJob.job_details.employment_type || 'N/A'}</p>
                </div>
                <div>
                  <h5 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Location</h5>
                  <p className="text-sm font-semibold">
                    {selectedJob.job_details.location?.city ? `${selectedJob.job_details.location.city}, ${selectedJob.job_details.location.country}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <h5 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Salary</h5>
                  <p className="text-sm font-semibold text-emerald-400">
                    {selectedJob.job_details.salary?.disclosed && selectedJob.job_details.salary?.min
                      ? `${selectedJob.job_details.salary.currency} ${selectedJob.job_details.salary.min} - ${selectedJob.job_details.salary.max}`
                      : 'Not Disclosed'}
                  </p>
                </div>
              </div>
            )}

            <h3 className="text-lg font-semibold mb-2">Why you match</h3>
            <p className="text-gray-300 bg-gray-900 p-4 rounded-lg leading-relaxed mb-6">
              {selectedJob.explanation}
            </p>

            {selectedJob.requirements?.responsibilities && selectedJob.requirements.responsibilities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Key Responsibilities</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-1 bg-gray-900 p-4 rounded-lg">
                  {selectedJob.requirements.responsibilities.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <h3 className="text-lg font-semibold mb-2">Job Description</h3>
            <div 
              className="text-gray-300 bg-gray-900 p-4 rounded-lg leading-relaxed max-h-64 overflow-y-auto mb-6 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: selectedJob.description || '' }}
            />
            
            <button 
              onClick={() => handleApply(selectedJob)}
              disabled={applying || appliedJobs.has(selectedJob.job_id)}
              className="mt-6 w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg text-white font-bold hover:from-blue-500 hover:to-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? 'Applying...' : appliedJobs.has(selectedJob.job_id) ? 'Applied' : selectedJob.external_link ? 'Apply on Company Site' : 'Apply Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;
