import React from 'react';
import { Skeleton } from './Skeleton';

export const HomeSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-12">
    {/* Market Quick Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-card flex flex-col gap-3 p-4">
          <Skeleton variant="circle" width={36} height={36} />
          <div className="space-y-2">
            <Skeleton variant="text" width="60%" height={10} />
            <Skeleton variant="text" width="40%" height={20} />
          </div>
        </div>
      ))}
    </div>

    {/* Hero Section Skeleton */}
    <div className="glass-card h-80 flex flex-col md:flex-row items-center justify-between p-12">
      <div className="space-y-6 w-full md:w-1/2">
        <Skeleton variant="rect" width={120} height={24} className="rounded-full" />
        <div className="space-y-2">
          <Skeleton variant="rect" width="100%" height={60} />
          <Skeleton variant="rect" width="40%" height={30} />
        </div>
        <Skeleton variant="text" width="80%" />
      </div>
      <Skeleton variant="circle" width={160} height={160} className="hidden md:block" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton variant="text" width={200} height={30} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton variant="rect" width={48} height={48} />
                <div className="space-y-2">
                  <Skeleton variant="text" width={100} />
                  <Skeleton variant="text" width={60} height={10} />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton variant="text" width={60} />
                <Skeleton variant="text" width={40} height={10} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton variant="text" width={150} height={30} />
        <div className="glass-card p-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="text" width="30%" height={10} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="70%" height={10} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const TradeSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-4 md:px-6 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
    <div className="lg:col-span-2 space-y-4">
      <div className="glass-card p-3 md:p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-5">
            <Skeleton variant="rect" width={64} height={64} className="rounded-2xl" />
            <div className="space-y-2">
              <Skeleton variant="text" width={150} height={30} />
              <Skeleton variant="text" width={100} height={15} />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton variant="text" width={120} height={40} />
            <Skeleton variant="text" width={80} height={20} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 p-2.5 md:p-3.5 bg-card-header/50 rounded-2xl border border-border">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton variant="text" width="60%" height={10} />
              <Skeleton variant="text" width="100%" height={20} />
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card h-[500px] p-0" />
    </div>
    <div className="lg:col-span-1">
      <div className="glass-card h-[600px] space-y-6">
        <Skeleton variant="text" width="100%" height={40} />
        <Skeleton variant="rect" width="100%" height={100} />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton variant="rect" width="100%" height={50} />
          <Skeleton variant="rect" width="100%" height={50} />
        </div>
        <Skeleton variant="rect" width="100%" height={80} />
        <Skeleton variant="rect" width="100%" height={150} />
      </div>
    </div>
  </div>
);

export const WalletSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-8">
    <div className="glass-card h-64 p-10 flex flex-col md:flex-row items-center justify-between">
      <div className="space-y-6 w-full md:w-1/2">
        <Skeleton variant="text" width={150} />
        <Skeleton variant="text" width="100%" height={60} />
      </div>
      <div className="grid grid-cols-2 gap-4 w-full md:w-auto mt-8 md:mt-0">
        <Skeleton variant="rect" width={100} height={80} />
        <Skeleton variant="rect" width={100} height={80} />
        <Skeleton variant="rect" width={100} height={80} className="col-span-2" />
      </div>
    </div>
    <div className="glass-card p-0 overflow-hidden">
      <div className="p-6 border-b border-border flex justify-between items-center bg-card-header/50">
        <Skeleton variant="text" width={200} height={30} />
        <Skeleton variant="rect" width={120} height={40} />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center justify-between p-4 bg-card-header/30 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <Skeleton variant="rect" width={44} height={44} className="rounded-xl" />
              <div className="space-y-2">
                <Skeleton variant="text" width={120} />
                <Skeleton variant="text" width={80} height={10} />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={60} height={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const HistorySkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-8">
    <Skeleton variant="text" width={250} height={40} />
    <div className="glass-card p-0 overflow-hidden">
      <div className="p-6 border-b border-border flex justify-between items-center bg-card-header/50">
        <Skeleton variant="text" width={150} height={24} />
        <div className="flex gap-2">
          <Skeleton variant="rect" width={100} height={36} className="rounded-full" />
          <Skeleton variant="rect" width={100} height={36} className="rounded-full" />
        </div>
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center justify-between p-4 hover:bg-card-header/20 rounded-2xl transition-all border border-transparent hover:border-border">
            <div className="flex items-center gap-4">
              <Skeleton variant="rect" width={44} height={44} className="rounded-xl" />
              <div className="space-y-2">
                <Skeleton variant="text" width={150} />
                <Skeleton variant="text" width={100} height={10} />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={80} height={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const NewsSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-8">
    <div className="space-y-4 text-center">
      <Skeleton variant="rect" width={100} height={24} className="mx-auto rounded-full" />
      <Skeleton variant="text" width="60%" height={48} className="mx-auto" />
      <Skeleton variant="text" width="40%" height={24} className="mx-auto" />
    </div>
    <div className="glass-card h-96" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-card h-64" />
      <div className="glass-card h-64" />
    </div>
    <div className="glass-card h-48" />
  </div>
);

export const AdminSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8">
    <div className="flex justify-between items-center">
      <Skeleton variant="text" width={200} height={40} />
      <Skeleton variant="rect" width={150} height={40} className="rounded-xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="glass-card h-32 flex flex-col justify-center gap-3">
          <Skeleton variant="text" width="40%" height={12} />
          <Skeleton variant="text" width="80%" height={24} />
        </div>
      ))}
    </div>
    <div className="glass-card h-[500px] space-y-6">
      <div className="flex justify-between border-b border-border pb-4 bg-card-header/50 -mx-6 px-6 pt-1">
        <Skeleton variant="text" width={150} height={20} />
        <Skeleton variant="rect" width={100} height={30} className="rounded-lg" />
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-4 items-center px-2">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="30%" height={10} />
            <Skeleton variant="text" width="60%" height={10} />
          </div>
          <Skeleton variant="rect" width={80} height={20} className="rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

export const SettingsSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
    <div className="md:w-64 space-y-8">
      <div className="space-y-4">
        <Skeleton variant="text" width={100} height={10} />
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" width={40} height={40} />
            <div className="space-y-2">
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={60} height={10} />
            </div>
          </div>
          <div className="pt-4 border-t border-border space-y-2">
            <Skeleton variant="text" width={80} height={10} />
            <Skeleton variant="text" width={120} height={24} />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton variant="text" width={100} height={10} />
        <div className="glass-card p-2 space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} variant="rect" width="100%" height={40} className="rounded-xl" />
          ))}
        </div>
      </div>
    </div>
    <div className="flex-1 space-y-6">
      <div className="glass-card h-96" />
      <div className="glass-card h-64" />
    </div>
  </div>
);
