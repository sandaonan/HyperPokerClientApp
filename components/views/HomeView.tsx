
import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronRight, Search, Loader2, AlertTriangle, UserCheck, Clock, Map as MapIcon, Navigation, Star, X, Phone, Globe, ChevronDown, ChevronUp, Minus, Locate, BadgeCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Header } from '../ui/Header';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SEED_CLUBS, NEARBY_CLUBS_DATA } from '../../constants';
import { Club, Wallet, NearbyClub } from '../../types';
import { mockApi } from '../../services/mockApi';
import { useAlert } from '../../contexts/AlertContext';

// Declaration for Leaflet attached to window
declare global {
  interface Window {
    L: any;
  }
}

interface HomeViewProps {
  onSelectClub: (club: Club) => void;
  onJoinNew: () => void;
  isGuest: boolean;
}

// Custom Map Component using Leaflet
const LeafletMap: React.FC<{ 
    places: NearbyClub[], 
    selectedPlaceId: string | null, 
    onSelectPlace: (id: string) => void,
    userLocation: { lat: number, lng: number } | null
}> = ({ places, selectedPlaceId, onSelectPlace, userLocation }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<{[key: string]: any}>({});
    const userMarkerRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || window.L === undefined) return;

        if (!mapInstance.current) {
            // Initialize Map centered on Taipei or User
            const initialCenter = userLocation ? [userLocation.lat, userLocation.lng] : [25.040, 121.550];
            
            mapInstance.current = window.L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView(initialCenter, 13);

            // Dark Mode Tiles (CartoDB Dark Matter)
            window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapInstance.current);

            // Custom Zoom Control position
            window.L.control.zoom({
                position: 'topright'
            }).addTo(mapInstance.current);
        }

        // --- CRITICAL FIX: ResizeObserver ---
        const resizeObserver = new ResizeObserver(() => {
            if (mapInstance.current) {
                mapInstance.current.invalidateSize();
            }
        });
        resizeObserver.observe(mapRef.current);

        setTimeout(() => {
            if (mapInstance.current) {
                mapInstance.current.invalidateSize();
            }
        }, 300);

        // Add Markers (Clubs)
        places.forEach(place => {
            if (!markersRef.current[place.place_id]) {
                const color = place.isPartner ? '#f59e0b' : '#10b981'; // Gold for Partner, Emerald for others
                
                const customIcon = window.L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="
                        background-color: ${color};
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        border: 2px solid #000;
                        box-shadow: 0 0 10px rgba(0,0,0, 0.5);
                        box-sizing: border-box; 
                    "></div>`,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                });

                const marker = window.L.marker([place.latitude, place.longitude], { icon: customIcon })
                    .addTo(mapInstance.current)
                    .on('click', () => onSelectPlace(place.place_id));
                
                markersRef.current[place.place_id] = marker;
            }
        });

        return () => {
             resizeObserver.disconnect();
        };
    }, []);

    // Effect for User Marker
    useEffect(() => {
        if (!mapInstance.current || !window.L) return;

        if (userLocation) {
            if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
            } else {
                // Create Blue Pulsing Dot for User
                const userIcon = window.L.divIcon({
                    className: 'user-location-icon',
                    html: `<div style="position: relative; width: 16px; height: 16px;">
                             <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);"></div>
                             <div style="position: absolute; top: -8px; left: -8px; right: -8px; bottom: -8px; background-color: rgba(59, 130, 246, 0.3); border-radius: 50%; animation: pulse 2s infinite;"></div>
                           </div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });
                
                userMarkerRef.current = window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 })
                    .addTo(mapInstance.current);
            }
        }
    }, [userLocation]);

    // Effect to handle selection changes (flyTo)
    useEffect(() => {
        if (mapInstance.current && selectedPlaceId) {
            const place = places.find(p => p.place_id === selectedPlaceId);
            if (place) {
                mapInstance.current.invalidateSize(); 

                mapInstance.current.flyTo([place.latitude, place.longitude], 16, {
                    animate: true,
                    duration: 1
                });
                
                // Update Marker Style (Highlight)
                Object.keys(markersRef.current).forEach(id => {
                    const marker = markersRef.current[id];
                    const isSelected = id === selectedPlaceId;
                    const p = places.find(pl => pl.place_id === id);
                    const color = p?.isPartner ? '#f59e0b' : '#10b981';

                    const iconHtml = isSelected 
                        ? `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 15px ${color}; box-sizing: border-box; position: relative;">
                             <div style="position: absolute; top: -4px; left: -4px; right: -4px; bottom: -4px; border: 1px solid ${color}; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                           </div>`
                        : `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #000; box-sizing: border-box;"></div>`;
                    
                    const newIcon = window.L.divIcon({
                        className: 'custom-div-icon',
                        html: iconHtml,
                        iconSize: isSelected ? [20, 20] : [12, 12],
                        iconAnchor: isSelected ? [10, 10] : [6, 6] 
                    });
                    
                    marker.setIcon(newIcon);
                    marker.setZIndexOffset(isSelected ? 1000 : 0);
                });
            }
        }
    }, [selectedPlaceId, places]);

    // Handle center on user
    const centerOnUser = () => {
        if (mapInstance.current && userLocation) {
             mapInstance.current.flyTo([userLocation.lat, userLocation.lng], 15, { animate: true });
        }
    };

    return (
        <>
            <style>{`
                @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
                @keyframes pulse { 0% { transform: scale(0.5); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: scale(1.2); opacity: 0; } }
            `}</style>
            <div className="w-full h-full relative">
                <div ref={mapRef} className="w-full h-full z-0 bg-[#0a0a0a]" />
                {userLocation && (
                    <button 
                        onClick={centerOnUser}
                        className="absolute top-4 right-4 z-[400] bg-slate-800 text-white p-2 rounded-lg shadow-lg border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all"
                    >
                        <Locate size={20} className="text-blue-400" />
                    </button>
                )}
            </div>
        </>
    );
};

const ClubMapModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
             // Request Geolocation
             if ("geolocation" in navigator) {
                 navigator.geolocation.getCurrentPosition(
                     (position) => {
                         setUserLocation({
                             lat: position.coords.latitude,
                             lng: position.coords.longitude
                         });
                     },
                     (err) => console.log("Geolocation denied or error", err)
                 );
             }
        }
    }, [isOpen]);

    // Scroll to selected item in list
    useEffect(() => {
        if (selectedPlaceId && listRef.current) {
            const el = document.getElementById(`place-card-${selectedPlaceId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [selectedPlaceId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300 h-[100dvh]">
            {/* Header - Fixed Height */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-20 shadow-xl shrink-0 h-16">
                <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <MapIcon className="text-emerald-400" size={18} /> 探索身邊的協會
                    </h3>
                    <p className="text-xs text-slate-400">大台北地區熱門撲克競技協會</p>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white border border-slate-700">
                    <X size={20} />
                </button>
            </div>
            
            {/* Layout Container */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                
                {/* Map Area - Takes remaining space (approx 55-60%) */}
                <div className="flex-grow relative z-0 min-h-0">
                     <LeafletMap 
                        places={NEARBY_CLUBS_DATA}
                        selectedPlaceId={selectedPlaceId}
                        onSelectPlace={setSelectedPlaceId}
                        userLocation={userLocation}
                     />
                     {/* Overlay Gradient for smooth transition */}
                     <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-10"></div>
                </div>

                {/* List View - Fixed Height ratio (approx 40-45%) */}
                <div 
                    ref={listRef}
                    className="h-[45%] shrink-0 bg-slate-900 border-t border-slate-800 overflow-y-auto p-4 space-y-3 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20 pb-safe"
                >
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">附近的據點 ({NEARBY_CLUBS_DATA.length})</span>
                    </div>

                    {NEARBY_CLUBS_DATA.map(place => {
                        const isSelected = selectedPlaceId === place.place_id;
                        
                        return (
                            <div 
                                key={place.place_id} 
                                id={`place-card-${place.place_id}`}
                                onClick={() => setSelectedPlaceId(isSelected ? null : place.place_id)}
                                className={`rounded-lg border transition-all duration-300 overflow-hidden cursor-pointer ${isSelected ? 'bg-slate-800 border-gold ring-1 ring-gold shadow-lg transform scale-[1.02]' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`}
                            >
                                <div className="p-3 flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>{place.name}</h4>
                                            {place.isPartner && (
                                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] py-0 px-1.5 flex items-center gap-1 whitespace-nowrap">
                                                    <BadgeCheck size={10} /> 合作夥伴
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                            <MapIcon size={10} /> {place.vicinity}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className={`${place.openNow ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20' : 'bg-slate-700 text-slate-400'} text-[10px]`}>
                                                {place.openNow ? '營業中' : '休息中'}
                                            </Badge>
                                            <span className="text-[10px] text-yellow-500 flex items-center gap-1 font-bold">
                                                <Star size={10} fill="currentColor" /> {place.rating}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 pl-2">
                                        {isSelected ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                    </div>
                                </div>
                                
                                {/* Expandable Details */}
                                {isSelected && (
                                    <div className="px-3 pb-3 pt-0 border-t border-slate-700/50 mt-1 animate-in slide-in-from-top-2">
                                        <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                                            <a 
                                                href={place.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Navigation size={14} /> 導航
                                            </a>
                                            
                                            {place.website ? (
                                                <a 
                                                    href={place.website}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Globe size={14} /> 網站
                                                </a>
                                            ) : (
                                                <button disabled className="bg-slate-700/50 text-slate-500 p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                                                    <Globe size={14} /> 無網站
                                                </button>
                                            )}

                                            <button 
                                                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Phone size={14} /> 致電
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-3 text-xs text-slate-400 bg-black/20 p-3 rounded border border-slate-800/50">
                                            <div className="flex flex-col gap-1 border-b border-slate-700/50 pb-2">
                                                <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">地址</span>
                                                <span className="text-slate-200">{place.formatted_address || place.address}</span>
                                            </div>
                                            <div>
                                                 <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold block mb-1">營業時間</span>
                                                 {place.opening_hours ? (
                                                     <div className="space-y-1">
                                                         {place.opening_hours.map((hour, idx) => (
                                                             <div key={idx} className="flex justify-between text-[10px] text-slate-300">
                                                                 <span>{hour.split(': ')[0]}</span>
                                                                 <span className="text-emerald-400">{hour.split(': ')[1]}</span>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 ) : (
                                                     <div className="text-right">
                                                         <span className="text-emerald-400 block">今日 14:00 - 06:00 (預設)</span>
                                                     </div>
                                                 )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {/* Spacer for safe area */}
                    <div className="h-6"></div>
                </div>
            </div>
        </div>
    );
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectClub, isGuest }) => {
  const { showAlert } = useAlert();
  const [joinedClubs, setJoinedClubs] = useState<Club[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Join Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Map Modal
  const [showMap, setShowMap] = useState(false);

  // Verification Alert Modal
  const [showVerifyAlert, setShowVerifyAlert] = useState(false);

  const fetchMyClubs = async () => {
      if (isGuest) {
          // In Guest Mode, "My Clubs" is effectively showing all Seed Clubs as discovery
          setJoinedClubs(SEED_CLUBS);
          setLoading(false);
          return;
      }

      const userId = localStorage.getItem('hp_session_user_id');
      if (!userId) return;

      const allWallets: Wallet[] = JSON.parse(localStorage.getItem('hp_wallets') || '[]');
      const myWallets = allWallets.filter(w => w.userId === userId && w.status !== 'banned');
      
      const myClubIds = myWallets.map(w => w.clubId);
      const myClubs = SEED_CLUBS.filter(c => myClubIds.includes(c.id));
      
      setJoinedClubs(myClubs);
      setWallets(myWallets); 
      setLoading(false);
  };

  useEffect(() => {
      fetchMyClubs();
      const interval = setInterval(fetchMyClubs, 3000);
      return () => clearInterval(interval);
  }, [isGuest]);

  const handleOpenJoinModal = () => {
      const activeClubIds = joinedClubs.map(c => c.id);
      // For guest, joinedClubs is ALL clubs, so available might be empty or we just show all again
      const others = isGuest ? SEED_CLUBS : SEED_CLUBS.filter(c => !activeClubIds.includes(c.id));
      setAvailableClubs(others);
      setShowJoinModal(true);
  };

  const handleApplyJoin = async (e: React.MouseEvent, clubId: string) => {
      e.stopPropagation(); 
      if (isGuest) {
          await showAlert("需要登入", "請先註冊或登入會員，即可申請加入協會並開始報名賽事。");
          return;
      }
      
      const userId = localStorage.getItem('hp_session_user_id');
      if (!userId) return;
      
      setProcessingId(clubId);
      try {
          await mockApi.joinClub(userId, clubId);
          await showAlert("申請成功", "系統將自動進行審核 (約需 8 秒)。\n審核通過後，若您資料未經驗證，請至櫃檯進行身份核對。");
          fetchMyClubs(); 
          setShowJoinModal(false);
      } catch (e: any) {
          await showAlert("錯誤", e.message);
      } finally {
          setProcessingId(null);
      }
  };

  const handleClubClick = (club: Club) => {
      onSelectClub(club);
  };

  const handleWarningClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowVerifyAlert(true);
  };

  const renderClubCard = (club: Club) => {
      const wallet = wallets.find(w => w.clubId === club.id);
      const isPending = wallet?.status === 'pending';
      const isApplying = wallet?.status === 'applying';
      // Guest always sees "Enter Club" style without status badges
      
      return (
        <Card 
            key={club.id} 
            onClick={() => handleClubClick(club)}
            className={`group relative overflow-hidden transition-all duration-300 hover:shadow-amber-500/10 hover:border-amber-500/50 ${isPending || isApplying ? 'border-slate-600 border-dashed bg-surfaceHighlight/50' : ''}`}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

            {!isGuest && isPending && (
                <div 
                    onClick={handleWarningClick}
                    className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 px-2 py-1 rounded-full text-xs font-bold border border-yellow-500/40 cursor-pointer animate-pulse"
                >
                    <AlertTriangle size={12} /> 需驗證身份
                </div>
            )}

            {!isGuest && isApplying && (
                <div 
                    className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-bold border border-blue-500/40"
                >
                    <Clock size={12} /> 申請審核中
                </div>
            )}

            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-gold transition-colors font-display tracking-wide">
                  {club.name}
                </h3>
                <span className="text-xs text-textMuted font-mono">ID: {club.localId}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-textMuted">
                <span>{club.description?.substring(0, 20)}...</span>
                <span className="whitespace-nowrap group-hover:translate-x-1 transition-transform text-white flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-gold">
                    {isGuest ? '瀏覽內容' : '進入協會'} <ChevronRight size={14} />
                </span>
            </div>
        </Card>
      );
  };

  return (
    <div className="space-y-6 pb-20">
      <Header />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-display">
              {isGuest ? '熱門協會 (Guest)' : '我的協會'}
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
             <div className="text-center py-10 text-textMuted">載入中...</div>
        ) : joinedClubs.length > 0 ? (
             joinedClubs.map(renderClubCard)
        ) : (
            <div className="text-center py-12 bg-surfaceHighlight/30 rounded-2xl border border-dashed border-slate-700">
                <p className="text-slate-500">您尚未加入任何協會</p>
            </div>
        )}
      </div>
      
      <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
        <div className="text-center">
            <p className="text-sm text-textMuted mb-4">尋找新的戰場？</p>
            <button 
              onClick={handleOpenJoinModal}
              className="w-full py-4 border border-dashed border-amber-600/30 bg-amber-600/5 rounded-xl text-amber-500 hover:text-amber-400 hover:border-amber-500 hover:bg-amber-600/10 transition-all flex items-center justify-center gap-2 font-bold tracking-wide"
            >
              <Search size={16} />
              加入新協會
            </button>
        </div>
        
        {/* NEW CTA: Explore Map */}
        <div 
            onClick={() => setShowMap(true)}
            className="relative w-full h-24 rounded-xl overflow-hidden cursor-pointer group border border-slate-700 hover:border-emerald-500/50 transition-all"
        >
             <div className="absolute inset-0 bg-slate-900">
                 {/* Decorative Map Dots */}
                 <div className="absolute top-4 left-10 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                 <div className="absolute bottom-6 right-20 w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                 <div className="absolute top-10 right-10 w-2 h-2 bg-slate-600 rounded-full"></div>
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 to-transparent"></div>
                 
                 {/* Fake Map Background using generic pattern if needed, but styling is enough */}
                 <div className="absolute inset-0 opacity-20" style={{
                     backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                     backgroundSize: '20px 20px'
                 }}></div>
             </div>
             <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-wider group-hover:scale-105 transition-transform">
                      <MapIcon size={20} />
                      探索你身邊的協會
                  </div>
             </div>
        </div>
      </div>

      {/* Join Club Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="探索協會">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {availableClubs.length > 0 ? (
                  availableClubs.map(club => {
                      return (
                        <div 
                            key={club.id} 
                            onClick={() => {
                                setShowJoinModal(false);
                                onSelectClub(club);
                            }}
                            className="bg-surfaceHighlight p-4 rounded-xl border border-slate-700 cursor-pointer hover:bg-surfaceHighlight/80 hover:border-slate-500 transition-all"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-white">{club.name}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500">ID: {club.localId}</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{club.description}</p>
                            
                            <Button 
                                fullWidth 
                                size="sm" 
                                variant="primary"
                                onClick={(e) => handleApplyJoin(e, club.id)}
                                disabled={!!processingId}
                            >
                                {processingId === club.id ? (
                                    <Loader2 className="animate-spin" size={14} /> 
                                ) : (
                                    '申請加入'
                                )}
                            </Button>
                        </div>
                      );
                  })
              ) : (
                  <p className="text-center text-slate-500 py-8">目前沒有可加入的協會</p>
              )}
          </div>
      </Modal>

      {/* Verification Explanation Modal */}
      <Modal isOpen={showVerifyAlert} onClose={() => setShowVerifyAlert(false)} title="需要身份驗證">
         <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto text-yellow-500">
                <UserCheck size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">您的會籍尚未啟用</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
                可能的原因：<br/>
                1. 您剛申請加入此協會（需至櫃檯開通）。<br/>
                2. 您近期修改了個人檔案資料（需重新核對）。
            </p>
            <div className="bg-slate-800 p-4 rounded-lg text-sm text-slate-300 text-left border border-slate-700">
                <p className="font-bold mb-2 text-white">如何解決？</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>請攜帶身份證件前往該協會櫃檯。</li>
                    <li>工作人員核對資料無誤後，將為您啟用報名權限。</li>
                </ul>
            </div>
            <Button fullWidth onClick={() => setShowVerifyAlert(false)}>了解</Button>
         </div>
      </Modal>

      {/* Full Screen Map Modal */}
      <ClubMapModal isOpen={showMap} onClose={() => setShowMap(false)} />

    </div>
  );
};
