
import React, { useState, useEffect, useRef } from 'react';
import { Ticket, History, Loader2, Store, Clock, Filter, Trophy, Coins, Check, ChevronDown, ChevronUp, Bell, BellOff, Send } from 'lucide-react';
import { GAME_HISTORY, SEED_CLUBS, SEED_TOURNAMENTS } from '../../constants';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Header } from '../ui/Header';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { TournamentDetailModal } from './TournamentDetailModal';
import { Tournament, Registration, GameRecord } from '../../types';
import { mockApi } from '../../services/mockApi';
import { useAlert } from '../../contexts/AlertContext';
import { THEME } from '../../theme';
import {
  getNotificationPermission,
  isPushNotificationSupported,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  hasPushSubscriptionInDatabase,
} from '../../services/pushNotification';

interface StatsViewProps {
  userId: string;
  onNavigateTournaments: () => void;
}

interface ActiveGame {
    registration: Registration;
    tournament: Tournament;
}

export const StatsView: React.FC<StatsViewProps> = ({ userId, onNavigateTournaments }) => {
  const { showAlert, showConfirm } = useAlert();
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  
  const [selectedGame, setSelectedGame] = useState<ActiveGame | null>(null);
  const [historyDetailTournament, setHistoryDetailTournament] = useState<Tournament | null>(null);
  const [historyDetailRegistration, setHistoryDetailRegistration] = useState<Registration | undefined>(undefined);
  
  // Collapsible States
  const [showHistory, setShowHistory] = useState(false);

  // Filter State
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('All');
  const uniqueClubs = ['All', ...new Set(GAME_HISTORY.map(g => g.clubName))];
  
  // Push notification state
  const [pushSupported, setPushSupported] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  
  // Use ref to track if user manually closed notifications (prevent useEffect from overriding)
  const userManuallyClosedRef = useRef<boolean>(false);
  
  // Push notification status - check both permission and actual subscription in database
  useEffect(() => {
      // Skip check if user manually closed (wait for next userId change or page refresh)
      if (userManuallyClosedRef.current) {
          return;
      }
      
      const checkPushStatus = async () => {
          const supported = isPushNotificationSupported();
          setPushSupported(supported);
          const permission = getNotificationPermission();
          setPushPermission(permission);
          
          // Check if user actually has a subscription in database
          if (supported && permission === 'granted' && userId && userId !== 'guest') {
              try {
                  const memberId = parseInt(userId);
                  if (!isNaN(memberId)) {
                      const hasSubscription = await hasPushSubscriptionInDatabase(memberId);
                      setPushEnabled(hasSubscription);
                  } else {
                      setPushEnabled(false);
                  }
              } catch (error) {
                  console.error('[StatsView] Error checking push subscription:', error);
                  setPushEnabled(false);
              }
          } else {
              setPushEnabled(false);
          }
      };
      
      checkPushStatus();
  }, [userId]);
  
  const handleTogglePush = async (checked: boolean) => {
      if (isToggling) return; // Prevent multiple clicks
      
      if (!pushSupported) {
          setPushEnabled(false);
          await showAlert('不支援推播', '此裝置不支援推播通知功能');
          return;
      }

      if (!userId || userId === 'guest') {
          setPushEnabled(false);
          await showAlert('需要登入', '請先登入會員後才能啟用推播通知');
          return;
      }

      setIsToggling(true);

      try {
          const memberId = parseInt(userId);
          if (isNaN(memberId)) {
              setPushEnabled(false);
              setIsToggling(false);
              await showAlert('錯誤', '無效的會員 ID');
              return;
          }

          const registration = await registerServiceWorker();
          if (!registration) {
              setPushEnabled(false);
              setIsToggling(false);
              await showAlert('註冊失敗', 'Service Worker 註冊失敗，請重新整理頁面後再試');
              return;
          }

          const currentPermission = getNotificationPermission();
          setPushPermission(currentPermission);

          if (currentPermission !== 'granted') {
              const permission = await requestNotificationPermission();
              setPushPermission(permission);

              if (permission !== 'granted') {
                  setPushEnabled(false);
                  setIsToggling(false);
                  if (permission === 'denied') {
                      await showAlert('權限被拒絕', '通知權限已被拒絕，請在瀏覽器設定中啟用通知權限');
                  } else {
                      await showAlert('權限未授予', '需要通知權限才能啟用推播通知');
                  }
                  return;
              }
          }

          if (checked) {
              // Subscribe to push notifications
              userManuallyClosedRef.current = false;
              await subscribeToPush(memberId, registration);
              const hasSubscription = await hasPushSubscriptionInDatabase(memberId);
              
              if (hasSubscription) {
                  setPushEnabled(true);
                  await showAlert('訂閱成功', '推播通知已啟用，您將收到賽事相關通知');
              } else {
                  setPushEnabled(false);
                  await showAlert('訂閱失敗', '無法確認訂閱狀態，請稍後再試');
              }
          } else {
              // Unsubscribe from push notifications
              userManuallyClosedRef.current = true;
              setPushEnabled(false); // Optimistically update UI
              await unsubscribeFromPush(memberId, registration);
              const permission = getNotificationPermission();
              setPushPermission(permission);
              await showAlert('已關閉', '推播通知已關閉');
          }
      } catch (e: any) {
          console.error('[StatsView] Error toggling push:', e);
          
          // 顯示詳細的錯誤訊息
          let errorMessage = '推播通知設定失敗';
          if (e.message) {
              if (e.message.includes('VAPID') || e.message.includes('key') || e.message.includes('金鑰')) {
                  errorMessage = 'VAPID 金鑰未配置或格式錯誤，請檢查環境變數設定';
              } else if (e.message.includes('權限') || e.message.includes('permission') || e.message.includes('policy') || e.message.includes('RLS')) {
                  errorMessage = '資料庫權限錯誤，請檢查 RLS 策略設定';
              } else if (e.message.includes('Service Worker') || e.message.includes('service worker')) {
                  errorMessage = 'Service Worker 註冊失敗，請重新整理頁面';
              } else if (e.message.includes('訂閱') || e.message.includes('subscription')) {
                  errorMessage = `訂閱失敗：${e.message}`;
              } else {
                  errorMessage = e.message;
              }
          }
          
          await showAlert('設定失敗', errorMessage);
          
          // Revert state on error
          if (checked) {
              setPushEnabled(false);
              userManuallyClosedRef.current = false;
          } else {
              setPushEnabled(true);
              userManuallyClosedRef.current = false;
          }
      } finally {
          setIsToggling(false);
      }
  };

  const handleTestNotification = async () => {
      if (!userId || userId === 'guest') {
          await showAlert('需要登入', '請先登入會員後才能測試推播通知');
          return;
      }

      const memberId = parseInt(userId);
      if (isNaN(memberId)) {
          await showAlert('錯誤', '無效的會員 ID');
          return;
      }

      if (!pushEnabled) {
          await showAlert('未啟用', '請先啟用推播通知後再測試');
          return;
      }

      // 檢查通知權限和 Service Worker
      const permission = getNotificationPermission();
      if (permission !== 'granted') {
          await showAlert('權限未授予', `通知權限狀態：${permission}\n\n請在瀏覽器設定中允許通知權限`);
          return;
      }

      // 檢查 Service Worker
      try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          if (registrations.length === 0) {
              await showAlert('Service Worker 未註冊', '請重新整理頁面後再試');
              return;
          }

          const subscription = await registrations[0].pushManager.getSubscription();
          if (!subscription) {
              await showAlert('未訂閱', '推播訂閱不存在，請重新啟用推播通知');
              return;
          }
      } catch (e: any) {
          console.error('[StatsView] Error checking Service Worker:', e);
          await showAlert('檢查失敗', '無法檢查 Service Worker 狀態');
          return;
      }

      setIsTesting(true);
      try {
          const { sendPushNotification } = await import('../../services/pushNotificationTrigger');
          await sendPushNotification({
              memberId,
              notificationType: 'reservation_created',
              tournamentName: '測試賽事',
              startTime: new Date().toISOString()
          });
          
          // 檢查 Service Worker 狀態
          const registrations = await navigator.serviceWorker.getRegistrations();
          const activeSW = registrations.find(reg => reg.active);
          const swState = activeSW ? (activeSW.active?.state || 'unknown') : 'not found';
          
          // 顯示診斷資訊
          const diagnosticInfo = [
              '✅ 測試通知已發送',
              '',
              '診斷資訊：',
              `• 通知權限：${permission}`,
              `• Service Worker：已註冊 (狀態: ${swState})`,
              `• 推播訂閱：已訂閱`,
              `• 當前 URL：${window.location.origin}`,
              '',
              '如果沒有收到通知，請檢查：',
              '1. 打開瀏覽器控制台（F12），查看是否有',
              '   "[Service Worker] 🔔 Push event received!" 日誌',
              '2. 如果沒有日誌，表示 Service Worker 未收到推送',
              '3. 檢查瀏覽器是否允許通知（系統設定）',
              '4. 是否開啟了「勿擾模式」',
              '5. 瀏覽器是否在背景執行',
              '',
              '💡 提示：通知權限是基於 origin 的，',
              '   不需要包含完整路徑，localhost:3000 即可'
          ].join('\n');
          
          await showAlert('測試通知已發送', diagnosticInfo);
      } catch (e: any) {
          console.error('[StatsView] Error testing notification:', e);
          await showAlert('測試失敗', e.message || '無法發送測試通知');
      } finally {
          setIsTesting(false);
      }
  };

  const loadMyGames = async () => {
      setLoading(true);
      try {
          const data = await mockApi.getMyRegistrations(userId);
          setActiveGames(data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    loadMyGames();
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, [userId]);

  const handleCancelRegistration = async () => {
      if (!selectedGame) return;
      
      // Update logic: Prevent cancellation of PAID entries
      if (selectedGame.registration.status === 'paid') {
          await showAlert("無法取消", "已付款之報名無法從 App 取消，請洽櫃檯人員。");
          return;
      }

      const confirmed = await showConfirm(
          "取消預約",
          "確定要取消預約嗎？"
      );

      if (confirmed) {
          try {
              await mockApi.cancelRegistration(userId, selectedGame.tournament.id);
              await showAlert("已取消", "已取消預約");
              setSelectedGame(null);
              loadMyGames(); 
          } catch (e: any) {
              await showAlert("錯誤", e.message);
          }
      }
  };

  const getClubName = (clubId: string) => {
      const club = SEED_CLUBS.find(c => c.id === clubId);
      return club ? club.name : 'Unknown Club';
  };

  const renderStateBadge = (t: Tournament) => {
    const startTime = new Date(t.startTime).getTime();
    const currentTime = now.getTime();
    
    // Mock logic: Assume game lasts 8 hours for 'Ended' visual
    const isEnded = currentTime > startTime + (8 * 60 * 60 * 1000);

    if (isEnded) {
        return <Badge className={`${THEME.buttonSecondary} ${THEME.textSecondary} border ${THEME.border}`}>已結束</Badge>;
    }
    if (t.isLateRegEnded) {
        return <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">已截買</Badge>;
    }
    return <Badge className="bg-brand-green/20 text-brand-green border border-brand-green/30">報名中</Badge>;
};

  const renderTimeDisplay = (startTimeIso: string) => {
      if (!startTimeIso) {
          return <div className={`font-mono ${THEME.textPrimary} font-bold text-sm`}>--:--</div>;
      }
      const start = new Date(startTimeIso);
      if (isNaN(start.getTime())) {
          console.warn('Invalid date:', startTimeIso);
          return <div className={`font-mono ${THEME.textPrimary} font-bold text-sm`}>--:--</div>;
      }
      const dateStr = `${start.getMonth() + 1}/${start.getDate()}`;
      const timeStr = start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
      return (
          <div className={`font-mono ${THEME.textPrimary} font-bold text-sm flex flex-col items-end`}>
              <span className="text-xs">{dateStr}</span>
              <span>{timeStr}</span>
          </div>
      );
  };

  const handleHistoryClick = (game: GameRecord) => {
      const template = SEED_TOURNAMENTS.find(t => t.name === game.gameName) || SEED_TOURNAMENTS[0];
      const clubId = SEED_CLUBS.find(c => c.name === game.clubName)?.id || 'mock-history';

      const mockTournament: Tournament = {
          ...template, 
          id: game.id,
          clubId: clubId, 
          name: game.gameName,
          buyIn: game.buyIn,
          type: game.type || template.type, 
          startTime: game.date, 
          reservedCount: game.entryCount * 10, 
          maxCap: game.entryCount * 10 + 5,
          isLateRegEnded: true, 
      };

      const mockReg: Registration = {
          id: `hist-reg-${game.id}`,
          tournamentId: game.id,
          userId: userId,
          status: 'paid', 
          timestamp: game.date
      };

      setHistoryDetailTournament(mockTournament);
      setHistoryDetailRegistration(mockReg);
  };

  const allHistory = [...GAME_HISTORY].reverse(); 
  const recent50 = allHistory.slice(0, 50);
  
  const filteredHistory = recent50.filter(game => {
      if (selectedClubFilter === 'All') return true;
      return game.clubName === selectedClubFilter;
  });

  // Group active games by Club ID
  const gamesByClub = activeGames.reduce((acc, game) => {
      const clubId = game.tournament.clubId;
      if (!acc[clubId]) acc[clubId] = [];
      acc[clubId].push(game);
      return acc;
  }, {} as Record<string, ActiveGame[]>);

  return (
    <div className="pb-24 space-y-8">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
            height: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 999px;
        }
      `}</style>
      <Header />
      
      <div>
        <h2 className={`text-2xl font-bold ${THEME.textPrimary} mb-6`}>我的賽事</h2>
        
        {/* Notification Settings - Simple Switch */}
        <Card className={`mb-4 ${THEME.card} border ${THEME.border}`}>
            <div className="flex items-center justify-between px-3 py-2 gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${pushEnabled ? 'bg-brand-green/20 border border-brand-green/30' : `${THEME.cardHover} border ${THEME.border}`}`}>
                        {pushEnabled ? (
                            <Bell size={16} className={THEME.accent} />
                        ) : (
                            <BellOff size={16} className={THEME.textSecondary} />
                        )}
                    </div>
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span className={`text-sm font-bold ${THEME.textPrimary} whitespace-nowrap`}>推播通知設定</span>
                        <span className={`text-xs ${THEME.textSecondary} whitespace-nowrap`}>
                            {pushEnabled ? '已啟用' : '已停用'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {pushEnabled && (
                        <Button
                            onClick={handleTestNotification}
                            disabled={isTesting || !pushSupported || !userId || userId === 'guest'}
                            className={`px-3 py-1.5 text-xs ${THEME.buttonSecondary} ${THEME.textSecondary} border ${THEME.border} hover:${THEME.buttonHover}`}
                        >
                            {isTesting ? (
                                <>
                                    <Loader2 className="animate-spin mr-1.5" size={12} />
                                    測試中
                                </>
                            ) : (
                                <>
                                    <Send size={12} className="mr-1.5" />
                                    測試通知
                                </>
                            )}
                        </Button>
                    )}
                    <Switch
                        checked={pushEnabled}
                        onCheckedChange={handleTogglePush}
                        disabled={isToggling || !pushSupported || !userId || userId === 'guest'}
                    />
                </div>
            </div>
        </Card>
        
        {/* Active / Registered Games Section */}
        <div className="mb-10">
          
          {loading ? (
              <div className={`flex justify-center py-8 ${THEME.textSecondary}`}>
                  <Loader2 className="animate-spin mr-2" /> 載入中...
              </div>
          ) : activeGames.length > 0 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {Object.entries(gamesByClub).map(([clubId, games]) => (
                  <div key={clubId}>
                      {/* Category Header */}
                      <div className="flex items-center gap-2 mb-3 px-1">
                          <Store size={14} className={THEME.accent} />
                          <span className={`text-sm font-bold ${THEME.textPrimary} tracking-wide`}>{getClubName(clubId)}</span>
                          <div className={`h-px ${THEME.border.replace('border', 'bg')} flex-1 ml-2`}></div>
                      </div>

                      <div className="space-y-3">
                          {games.map(item => {
                            const isPaid = item.registration.status === 'paid';
                            const totalPrice = item.tournament.buyIn + item.tournament.fee;
                            
                            return (
                            <Card 
                              key={item.registration.id} 
                              onClick={() => setSelectedGame(item)}
                              // Strengthened Visuals: Increased opacity of bg, added shadow-md
                              className={`p-3 border-l-4 cursor-pointer ${THEME.cardHover} transition-all hover:shadow-lg shadow-md ${isPaid ? 'border-l-brand-green bg-brand-green/10' : 'border-l-yellow-500 bg-yellow-500/10'}`}
                            >
                               <div className="flex justify-between items-center mb-2 gap-2">
                                    <div className="flex flex-col gap-1 overflow-hidden">
                                         <h4 className={`font-bold ${THEME.textPrimary} text-base truncate`}>{item.tournament.name}</h4>
                                         <div className="flex items-center gap-1.5 flex-wrap">
                                             {/* Status Badge */}
                                             {renderStateBadge(item.tournament)}
                                             {/* Reserved/Paid Badge */}
                                             <Badge variant={isPaid ? 'success' : 'warning'} className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                                                {isPaid ? '已付款' : '已預約'}
                                             </Badge>
                                             {/* Type Badge */}
                                             {item.tournament.type && (
                                                <span className={`text-[10px] ${THEME.textSecondary} border ${THEME.border} rounded px-1 w-fit`}>
                                                    {item.tournament.type}
                                                </span>
                                             )}
                                         </div>
                                    </div>
                                    {renderTimeDisplay(item.tournament.startTime)}
                               </div>

                               {/* Progress Bar Visual */}
                               <div className={`w-full ${THEME.card}/50 rounded-full h-1 mt-2 mb-2 overflow-hidden`}>
                                   <div className={`h-1 rounded-full ${isPaid ? 'bg-brand-green' : 'bg-yellow-500'} animate-pulse`} style={{width: '100%'}}></div>
                               </div>

                               <div className="flex items-center justify-between text-xs mt-2">
                                    <div className="flex items-center gap-2">
                                         <div className={`flex items-center gap-1 ${THEME.accent} font-mono font-bold text-base`}>
                                            <Coins size={14} />
                                            <span>${totalPrice.toLocaleString()}</span>
                                        </div>
                                         <span className={THEME.textSecondary}>|</span>
                                         <span className={THEME.textSecondary}>起始: {item.tournament.startingChips.toLocaleString()}</span>
                                    </div>
                                    
                                    {!isPaid ? (
                                       <span className="text-[10px] text-yellow-500/80 flex items-center gap-1 font-bold animate-pulse">
                                           <Check size={10} /> 請至櫃檯繳費
                                       </span>
                                    ) : (
                                       <span className={`text-[10px] ${THEME.accent}/80 flex items-center gap-1 font-bold`}>
                                           <Check size={10} /> 準備參賽
                                       </span>
                                    )}
                               </div>
                            </Card>
                          )})}
                      </div>
                  </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 bg-[#262626]/30 rounded-xl border border-dashed ${THEME.border}`}>
               <p className={`${THEME.textSecondary} text-sm mb-3`}>目前沒有已報名的賽事。</p>
               <button 
                 onClick={onNavigateTournaments}
                 className={`${THEME.accent} text-sm font-medium hover:underline`}
               >
                 前往報名
               </button>
            </div>
          )}
        </div>

        {/* Collapsible History Section */}
        <div className={`border ${THEME.border} rounded-xl overflow-hidden mb-4 bg-[#262626]/10`}>
            <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`w-full flex items-center justify-between p-4 bg-[#262626]/30 ${THEME.cardHover} transition-colors`}
            >
                <div className="flex items-center gap-2">
                    <History className={THEME.textSecondary} size={18} />
                    <span className={`text-base font-bold ${THEME.textPrimary}`}>歷史戰績</span>
                </div>
                {showHistory ? <ChevronUp size={18} className={THEME.textSecondary} /> : <ChevronDown size={18} className={THEME.textSecondary} />}
            </button>

            {showHistory && (
                <div className={`p-4 border-t ${THEME.border} animate-in fade-in slide-in-from-top-1 duration-200`}>
                    {/* Header & Filter */}
                    <div className="flex flex-col gap-3 mb-4">
                        <div className={`flex items-center gap-2 ${THEME.textSecondary} text-xs`}>
                            <span className="font-medium">近期紀錄 (最近50筆)</span>
                        </div>
                        
                        {/* Chips for Filtering */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                            {uniqueClubs.map(clubName => (
                                <button
                                    key={clubName}
                                    onClick={() => setSelectedClubFilter(clubName)}
                                    className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                                        selectedClubFilter === clubName 
                                        ? `${THEME.buttonSecondary} ${THEME.textPrimary} ${THEME.border}` 
                                        : `bg-transparent ${THEME.textSecondary} ${THEME.border} hover:${THEME.border}`
                                    }`}
                                >
                                    {clubName === 'All' ? '全部協會' : clubName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List Items */}
                    <div className="space-y-1">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map(game => (
                                <div 
                                    key={game.id} 
                                    onClick={() => handleHistoryClick(game)}
                                    className={`group flex justify-between items-center py-4 border-b ${THEME.border}/40 cursor-pointer hover:bg-white/5 transition-all px-2 -mx-2 rounded-lg opacity-80 hover:opacity-100`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className={`text-sm font-bold ${THEME.textPrimary} group-hover:${THEME.textPrimary} transition-colors`}>{game.gameName}</div>
                                        <div className={`flex items-center gap-2 text-xs ${THEME.textSecondary}`}>
                                            <span>{new Date(game.date).toLocaleDateString()}</span>
                                            <span className={`w-1 h-1 rounded-full ${THEME.border.replace('border', 'bg')}`}></span>
                                            <span className={THEME.textSecondary}>{game.clubName}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            {/* Profit Display - No negative values */}
                                            <div className={`font-mono font-bold text-sm ${game.profit > 0 ? THEME.accent : THEME.textSecondary}`}>
                                                {game.profit > 0 ? '+' : ''}{Math.max(0, game.profit).toLocaleString()}
                                            </div>
                                            {/* Points Display - Two types */}
                                            <div className="flex items-center gap-1.5">
                                                {game.points && game.points > 0 && (
                                                    <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5">
                                                        <Trophy size={8} /> {game.points} pts
                                                    </span>
                                                )}
                                                {game.activityPoints && game.activityPoints > 0 && (
                                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-0.5">
                                                        <Coins size={8} /> {game.activityPoints} 活動點數
                                                    </span>
                                                )}
                                            </div>
                                            {/* Buy-in count */}
                                            <div className={`text-[10px] ${THEME.textSecondary} mt-0.5`}>
                                                Buy-in: ${game.buyIn.toLocaleString()} {game.entryCount > 1 ? `(${game.entryCount}次)` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={`py-8 text-center ${THEME.textSecondary} text-sm italic`}>
                                查無相關賽事紀錄
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>


      </div>

      <TournamentDetailModal 
        tournament={selectedGame?.tournament || null} 
        userWallet={null} 
        registration={selectedGame?.registration}
        onClose={() => setSelectedGame(null)}
        onRegister={() => {}} 
        onCancel={handleCancelRegistration}
      />

      <TournamentDetailModal 
        tournament={historyDetailTournament} 
        userWallet={null} 
        registration={historyDetailRegistration}
        onClose={() => {
            setHistoryDetailTournament(null);
            setHistoryDetailRegistration(undefined);
        }}
        onRegister={() => {}} 
        onCancel={() => {}}
      />
      
    </div>
  );
};
