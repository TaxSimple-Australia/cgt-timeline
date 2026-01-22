'use client';

import { useState, useRef } from 'react';
import { Camera, Save, User, Phone, Briefcase, Award, FileText, Trash2 } from 'lucide-react';
import type { TaxAgentPublic } from '@/types/tax-agent';

interface ProfileEditorProps {
  agent: TaxAgentPublic;
  token: string;
  onUpdate: (agent: TaxAgentPublic) => void;
}

export default function ProfileEditor({ agent, token, onUpdate }: ProfileEditorProps) {
  const [bio, setBio] = useState(agent.bio || '');
  const [contactPhone, setContactPhone] = useState(agent.contactPhone || '');
  const [experienceYears, setExperienceYears] = useState(agent.experienceYears?.toString() || '');
  const [certifications, setCertifications] = useState(agent.certifications?.join(', ') || '');
  const [specializations, setSpecializations] = useState(agent.specializations?.join(', ') || '');
  const [photoBase64, setPhotoBase64] = useState(agent.photoBase64 || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      setError('Image must be less than 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoBase64(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/tax-agents/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: bio || undefined,
          contactPhone: contactPhone || undefined,
          experienceYears: experienceYears ? parseInt(experienceYears, 10) : undefined,
          certifications: certifications ? certifications.split(',').map(c => c.trim()).filter(Boolean) : undefined,
          specializations: specializations ? specializations.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          photoBase64: photoBase64 || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      onUpdate(data.agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Edit Profile</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              {photoBase64 ? (
                <img
                  src={photoBase64}
                  alt={agent.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Upload Photo
                </button>
                {photoBase64 && (
                  <button
                    onClick={handleRemovePhoto}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Max 500KB. Square images work best.
            </p>
          </div>

          {/* Name (read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={agent.name}
                disabled
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Contact your administrator to change your name
            </p>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="0400 000 000"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Years of Experience
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="10"
                min="0"
                max="50"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Certifications
            </label>
            <div className="relative">
              <Award className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                placeholder="CPA, Registered Tax Agent"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Separate with commas
            </p>
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Specializations
            </label>
            <input
              type="text"
              value={specializations}
              onChange={(e) => setSpecializations(e.target.value)}
              placeholder="Property CGT, Investment Properties, Small Business"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Separate with commas
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bio
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell clients about yourself and your expertise..."
                rows={4}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Card */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Preview (How clients see you)</h3>

        <div className="flex items-start gap-4">
          {photoBase64 ? (
            <img
              src={photoBase64}
              alt={agent.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-white">
                {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">{agent.name}</h4>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                agent.role === 'senior_tax_agent'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              }`}>
                {agent.role === 'senior_tax_agent' ? 'Senior Tax Agent' : 'Tax Agent'}
              </span>
            </div>
            {experienceYears && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {experienceYears} years experience
              </p>
            )}
            {certifications && (
              <div className="flex flex-wrap gap-1 mt-2">
                {certifications.split(',').map((cert, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                    {cert.trim()}
                  </span>
                ))}
              </div>
            )}
            {bio && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                {bio}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
