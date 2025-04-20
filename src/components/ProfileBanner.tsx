import React from 'react';

interface ProfileBannerProps {
  address: string;
  walletType: 'metamask' | 'phantom' | 'email' | 'other';
  score: number;
  onLogout: () => void;
  onShowTreasuresList: () => void;
  collectedTreasures: any[];
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({ 
  address, 
  walletType, 
  score, 
  onLogout,
  onShowTreasuresList,
  collectedTreasures
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
      <div className="text-gray-300 flex items-center">
        {walletType === 'metamask' && (
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path d="M21.3135 2L12.8173 8.10856L14.2756 4.59317L21.3135 2Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.68652 2L11.0951 8.1668L9.72477 4.59317L2.68652 2Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.3567 16.9679L16.166 20.4451L20.6906 21.7508L21.9909 17.0427L18.3567 16.9679Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.0177 17.0427L3.30948 21.7508L7.83397 20.4451L5.65187 16.9679L2.0177 17.0427Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.57323 11.218L6.34784 13.2811L10.8259 13.508L10.6756 8.62195L7.57323 11.218Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.4274 11.2179L13.2826 8.5639L13.1748 13.508L17.6522 13.281L16.4274 11.2179Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.83398 20.4451L10.5381 19.0278L8.20252 17.0762L7.83398 20.4451Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.4619 19.0278L16.1659 20.4451L15.7975 17.0762L13.4619 19.0278Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {walletType === 'phantom' && (
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#AB9FF2"/>
            <path d="M12 7L16 12L12 17L8 12L12 7Z" fill="#AB9FF2"/>
          </svg>
        )}
        {walletType === 'email' && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
        {walletType === 'email' ? (
          <span className="font-mono text-blue-400">{address.replace('email:', '')}</span>
        ) : (
          <span className="font-mono text-blue-400">{address.slice(0, 8)}...{address.slice(-6)}</span>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-yellow-500 font-bold">
          🪙 {score}
        </div>
        <button 
          className="text-sm text-gray-200 bg-blue-600 px-4 py-2 rounded-full cursor-pointer hover:bg-blue-700 flex items-center transition-colors"
          onClick={onShowTreasuresList}
        >
          <span className="mr-1">🎒</span>
          Treasures: {collectedTreasures.length}
        </button>
        <button 
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileBanner;
