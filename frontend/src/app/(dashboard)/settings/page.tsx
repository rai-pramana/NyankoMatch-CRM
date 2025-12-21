'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { usersApi, countriesApi } from '@/lib/api';
import { Country } from '@/lib/types';
import { useAuthStore } from '@/lib/store';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface CountryFormData {
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
  exchangeRate: number;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'countries'>('profile');
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);

  const { data: countries = [], isLoading: countriesLoading } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: countriesApi.getAll,
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>();

  const {
    register: registerCountry,
    handleSubmit: handleSubmitCountry,
    reset: resetCountry,
    formState: { errors: countryErrors },
  } = useForm<CountryFormData>();

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      usersApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
      resetPassword();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const createCountryMutation = useMutation({
    mutationFn: countriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Country created successfully');
      closeCountryModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create country');
    },
  });

  const updateCountryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CountryFormData }) => countriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Country updated successfully');
      closeCountryModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update country');
    },
  });

  const deleteCountryMutation = useMutation({
    mutationFn: countriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Country deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete country');
    },
  });

  const openCountryModal = (country?: Country) => {
    if (country) {
      setEditingCountry(country);
      resetCountry({
        name: country.name,
        code: country.code,
        currency: country.currency,
        currencySymbol: country.currencySymbol,
        exchangeRate: country.exchangeRate,
      });
    } else {
      setEditingCountry(null);
      resetCountry({
        name: '',
        code: '',
        currency: '',
        currencySymbol: '',
        exchangeRate: 1,
      });
    }
    setIsCountryModalOpen(true);
  };

  const closeCountryModal = () => {
    setIsCountryModalOpen(false);
    setEditingCountry(null);
    resetCountry();
  };

  const onSubmitPassword = (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const onSubmitCountry = (data: CountryFormData) => {
    const payload = {
      ...data,
      exchangeRate: Number(data.exchangeRate),
    };
    if (editingCountry) {
      updateCountryMutation.mutate({ id: editingCountry.id, data: payload });
    } else {
      createCountryMutation.mutate(payload);
    }
  };

  const handleDeleteCountry = (id: string) => {
    if (confirm('Are you sure you want to delete this country? This may affect related data.')) {
      deleteCountryMutation.mutate(id);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="w-full px-6 py-4 bg-background-light dark:bg-background-dark border-b border-transparent">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Home</span>
          <span className="text-slate-400 dark:text-slate-600 text-sm font-medium">/</span>
          <span className="text-slate-900 dark:text-white text-sm font-medium">Settings</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-slate-900 dark:text-white tracking-tight text-[28px] font-bold leading-tight">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm pt-1">
            Manage your account and system settings
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1000px] mx-auto">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Profile & Security
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('countries')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'countries'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Countries & Currencies
              </button>
            )}
          </div>

          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="card">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile Information</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-medium text-slate-900 dark:text-white">{user?.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                        user?.role === 'ADMIN'
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      }`}
                    >
                      {user?.role}
                    </span>
                  </div>
                </div>
                {user?.countries && user.countries.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assigned Countries</p>
                    <div className="flex flex-wrap gap-2">
                      {user.countries.map((country) => (
                        <span
                          key={country.id}
                          className="text-sm bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300"
                        >
                          {country.name} ({country.code})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="card">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Change Password</h3>
                <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4 max-w-md">
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white">Current Password</label>
                    <input
                      {...registerPassword('currentPassword', { required: 'Current password is required' })}
                      className="input mt-1"
                      type="password"
                      placeholder="••••••••"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white">New Password</label>
                    <input
                      {...registerPassword('newPassword', {
                        required: 'New password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' },
                      })}
                      className="input mt-1"
                      type="password"
                      placeholder="••••••••"
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white">Confirm New Password</label>
                    <input
                      {...registerPassword('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (val: string) => {
                          if (watch('newPassword') !== val) {
                            return 'Passwords do not match';
                          }
                        },
                      })}
                      className="input mt-1"
                      type="password"
                      placeholder="••••••••"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'countries' && user?.role === 'ADMIN' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Countries & Currencies</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Manage countries and their exchange rates (base currency: EUR)
                  </p>
                </div>
                <button onClick={() => openCountryModal()} className="btn-primary gap-2">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Add Country
                </button>
              </div>

              {countriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : countries.length === 0 ? (
                <div className="card text-center py-12">
                  <span className="material-symbols-outlined text-[48px] text-slate-400">public</span>
                  <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">No countries yet</h3>
                  <button onClick={() => openCountryModal()} className="btn-primary mt-4">
                    Add Country
                  </button>
                </div>
              ) : (
                <div className="card p-0 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Country</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Code</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Currency</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Exchange Rate</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countries.map((country) => (
                        <tr
                          key={country.id}
                          className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                            {country.name}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{country.code}</td>
                          <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">
                            {country.currencySymbol} {country.currency}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-slate-700 dark:text-slate-300">
                            1 EUR = {country.exchangeRate.toFixed(4)} {country.currency}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openCountryModal(country)}
                              className="p-2 text-slate-500 hover:text-primary transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCountry(country.id)}
                              className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Country Modal */}
      {isCountryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingCountry ? 'Edit Country' : 'Add Country'}
              </h2>
              <button onClick={closeCountryModal} className="text-slate-500 hover:text-slate-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitCountry(onSubmitCountry)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white">Country Name *</label>
                <input
                  {...registerCountry('name', { required: 'Name is required' })}
                  className="input mt-1"
                  placeholder="United States"
                />
                {countryErrors.name && <p className="text-sm text-red-500 mt-1">{countryErrors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-white">Country Code *</label>
                  <input
                    {...registerCountry('code', { required: 'Code is required' })}
                    className="input mt-1"
                    placeholder="US"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-white">Currency Code *</label>
                  <input
                    {...registerCountry('currency', { required: 'Currency is required' })}
                    className="input mt-1"
                    placeholder="USD"
                    maxLength={3}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-white">Currency Symbol *</label>
                  <input
                    {...registerCountry('currencySymbol', { required: 'Symbol is required' })}
                    className="input mt-1"
                    placeholder="$"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-white">Exchange Rate (to EUR) *</label>
                  <input
                    {...registerCountry('exchangeRate', { required: 'Exchange rate is required', min: 0 })}
                    className="input mt-1"
                    type="number"
                    step="0.0001"
                    placeholder="1.08"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exchange rate: How many of this currency equals 1 EUR. Example: If 1 EUR = 1.08 USD, enter 1.08
              </p>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeCountryModal} className="btn-outline flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={createCountryMutation.isPending || updateCountryMutation.isPending}
                >
                  {createCountryMutation.isPending || updateCountryMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
