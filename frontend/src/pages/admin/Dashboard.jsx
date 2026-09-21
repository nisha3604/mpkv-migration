import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminDashboardApi } from '../../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible,   setIsVisible]   = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dash,        setDash]        = useState(null);   // AdminDashboardData from API
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    adminDashboardApi.getDashboard()
      .then(res => { if (res.data?.success) setDash(res.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => clearInterval(timer);
  }, []);

  // Read a stat from API response; show '…' while loading
  const S = (key) => loading ? '…' : (dash?.[key] ?? '0');

  const links = [
    { label: 'College List', icon: 'fa-list', to: '/admin/college/list', desc: 'Search and manage all colleges', gradient: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/30' },
    { label: 'College Passwords', icon: 'fa-key', to: '/admin/college/passwords', desc: 'View and send college login passwords', gradient: 'from-sky-400 to-sky-600', shadow: 'shadow-sky-500/30' },
    { label: 'Reset College Password', icon: 'fa-lock-open', to: '/admin/college/reset-password', desc: 'Reset a college user password', gradient: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/30' },
    { label: 'Manage Menu', icon: 'fa-bars', to: '/admin/menu', desc: 'Add/edit/delete navigation menu items', gradient: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/30' },
    { label: 'Manage Notifications', icon: 'fa-bell', to: '/admin/notifications', desc: 'Control home page content', gradient: 'from-rose-400 to-rose-600', shadow: 'shadow-rose-500/30' },
    { label: 'Activity Status', icon: 'fa-calendar-alt', to: '/admin/activity-status', desc: 'Open/close registration windows', gradient: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-500/30' },
    { label: 'Admission Schedule', icon: 'fa-calendar-check', to: '/admin/admission-schedule', desc: 'Set per-round allotment windows', gradient: 'from-teal-400 to-teal-600', shadow: 'shadow-teal-500/30' },
  ];

  const courses = [
    {
      id: 1,
      title: dash?.courseName_1 || "DIPLOMA IN AGRICULTURE COURSE",
      meta: "MEDIUM : MARATHI | DURATION : 2 YEARS",
      theme: "from-blue-600 to-indigo-700",
      stats: [
        { label: "Registered",         value: S("registered_1"),        icon: "fa-user-plus",         color: "text-blue-600",    bg: "bg-blue-100",    border: "border-blue-200"    },
        { label: "Locked",             value: S("locked_1"),            icon: "fa-lock",              color: "text-indigo-600",  bg: "bg-indigo-100",  border: "border-indigo-200"  },
        { label: "Fully Verified",     value: S("fullyVerified_1"),     icon: "fa-check-circle",      color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-200" },
        { label: "Partially Verified", value: S("partiallyVerified_1"), icon: "fa-exclamation-circle",color: "text-amber-600",   bg: "bg-amber-100",   border: "border-amber-200"   },
        { label: "No. of Colleges",    value: S("noOfColleges_1"),      icon: "fa-university",        color: "text-purple-600",  bg: "bg-purple-100",  border: "border-purple-200"  },
        { label: "Intake",             value: S("intake_1"),            icon: "fa-users",             color: "text-cyan-600",    bg: "bg-cyan-100",    border: "border-cyan-200"    },
        { label: "Admitted",           value: S("admitted_1"),          icon: "fa-user-check",        color: "text-teal-600",    bg: "bg-teal-100",    border: "border-teal-200"    },
        { label: "Vacancy",            value: S("vacancy_1"),           icon: "fa-door-open",         color: "text-rose-600",    bg: "bg-rose-100",    border: "border-rose-200"    },
      ]
    },
    {
      id: 2,
      title: dash?.courseName_2 || "AGRICULTURE POLYTECHNIC COURSE",
      meta: "MEDIUM : ENGLISH | DURATION : 3 YEARS",
      theme: "from-emerald-600 to-teal-700",
      stats: [
        { label: "Registered",         value: S("registered_2"),        icon: "fa-user-plus",         color: "text-blue-600",    bg: "bg-blue-100",    border: "border-blue-200"    },
        { label: "Locked",             value: S("locked_2"),            icon: "fa-lock",              color: "text-indigo-600",  bg: "bg-indigo-100",  border: "border-indigo-200"  },
        { label: "Fully Verified",     value: S("fullyVerified_2"),     icon: "fa-check-circle",      color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-200" },
        { label: "Partially Verified", value: S("partiallyVerified_2"), icon: "fa-exclamation-circle",color: "text-amber-600",   bg: "bg-amber-100",   border: "border-amber-200"   },
        { label: "No. of Colleges",    value: S("noOfColleges_2"),      icon: "fa-university",        color: "text-purple-600",  bg: "bg-purple-100",  border: "border-purple-200"  },
        { label: "Intake",             value: S("intake_2"),            icon: "fa-users",             color: "text-cyan-600",    bg: "bg-cyan-100",    border: "border-cyan-200"    },
        { label: "Admitted",           value: S("admitted_2"),          icon: "fa-user-check",        color: "text-teal-600",    bg: "bg-teal-100",    border: "border-teal-200"    },
        { label: "Vacancy",            value: S("vacancy_2"),           icon: "fa-door-open",         color: "text-rose-600",    bg: "bg-rose-100",    border: "border-rose-200"    },
      ]
    },
    {
      id: 3,
      title: dash?.courseName_3 || "MALI TRAINING COURSE",
      meta: "MEDIUM : MARATHI | DURATION : 1 YEAR",
      theme: "from-amber-500 to-orange-600",
      stats: [
        { label: "Registered",         value: S("registered_3"),        icon: "fa-user-plus",         color: "text-blue-600",    bg: "bg-blue-100",    border: "border-blue-200"    },
        { label: "Locked",             value: S("locked_3"),            icon: "fa-lock",              color: "text-indigo-600",  bg: "bg-indigo-100",  border: "border-indigo-200"  },
        { label: "Fully Verified",     value: S("fullyVerified_3"),     icon: "fa-check-circle",      color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-200" },
        { label: "Partially Verified", value: S("partiallyVerified_3"), icon: "fa-exclamation-circle",color: "text-amber-600",   bg: "bg-amber-100",   border: "border-amber-200"   },
        { label: "No. of Colleges",    value: S("noOfColleges_3"),      icon: "fa-university",        color: "text-purple-600",  bg: "bg-purple-100",  border: "border-purple-200"  },
        { label: "Intake",             value: S("intake_3"),            icon: "fa-users",             color: "text-cyan-600",    bg: "bg-cyan-100",    border: "border-cyan-200"    },
        { label: "Admitted",           value: S("admitted_3"),          icon: "fa-user-check",        color: "text-teal-600",    bg: "bg-teal-100",    border: "border-teal-200"    },
        { label: "Vacancy",            value: S("vacancy_3"),           icon: "fa-door-open",         color: "text-rose-600",    bg: "bg-rose-100",    border: "border-rose-200"    },
      ]
    }
  ];

  return (
    <div className={`min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans transition-opacity duration-700 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* User Info Header */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-110"></div>
        <div className="relative z-10">
          <p className="text-xs font-bold text-indigo-500 mb-2 uppercase tracking-widest">Superadmin Control Panel</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">{user?.userName || 'Administrator'}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-medium flex items-center gap-2">
            <i className="fas fa-id-badge text-slate-400"></i> Login ID: {user?.userLoginID || 'ADMIN-001'} 
            <span className="text-slate-300">|</span> 
            <i className="fas fa-shield-alt text-slate-400"></i> Role: Super Admin
          </p>
        </div>
        <div className="relative z-10 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 flex items-center gap-4 shadow-inner">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-500">
            <i className="far fa-clock text-lg"></i>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Current Time</p>
            <p className="text-sm font-bold text-slate-700">{currentTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })}</p>
          </div>
        </div>
      </div>

      {/* Course Statistics Dashboard */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-chart-pie text-indigo-500"></i> Course Statistics Overview
        </h3>
        <div className="flex flex-col gap-6">
          {courses.map((course, index) => (
            <div key={course.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className={`bg-gradient-to-r ${course.theme} px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-2`}>
                <div>
                  <h4 className="text-white font-bold text-lg">{course.title}</h4>
                  <p className="text-white/80 text-xs font-medium tracking-wide mt-1">{course.meta}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-semibold flex items-center gap-2 w-fit">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Live Data
                </div>
              </div>
              
              <div className="p-6 bg-slate-50/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {course.stats.map((stat, i) => (
                    <div key={i} className={`relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border ${stat.border} group hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300`}>
                      <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full ${stat.bg} opacity-40 group-hover:scale-[1.5] transition-transform duration-700 ease-out`}></div>
                      <div className="relative z-10 flex items-center justify-between mb-4">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center ${stat.color} shadow-sm group-hover:rotate-12 transition-transform duration-300`}>
                          <i className={`fas ${stat.icon}`}></i>
                        </div>
                      </div>
                      <div className="relative z-10 mt-2">
                        <h5 className="text-3xl font-extrabold text-slate-800 tracking-tight">{stat.value}</h5>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-bolt text-amber-500"></i> Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {links.map((link, i) => (
            <button 
              key={i} 
              onClick={() => navigate(link.to)}
              className="bg-white rounded-xl p-5 text-left border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${link.gradient} opacity-5 rounded-bl-full transition-transform duration-500 group-hover:scale-150`}></div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br ${link.gradient} shadow-lg ${link.shadow} text-white transform group-hover:rotate-6 transition-transform duration-300`}>
                <i className={`fas ${link.icon} text-lg`} />
              </div>
              <div className="text-sm font-bold text-slate-800 mb-1 relative z-10">{link.label}</div>
              <div className="text-xs text-slate-500 font-medium relative z-10 line-clamp-2">{link.desc}</div>
            </button>
          ))}
        </div>
      </div>
      
    </div>
  );
}

