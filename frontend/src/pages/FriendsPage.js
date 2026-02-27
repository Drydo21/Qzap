import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/translations';
import { friendsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Users, UserPlus, Search, Check, X, Loader2 } from 'lucide-react';
import MobileNav from '../components/MobileNav';

export default function FriendsPage() {
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await friendsAPI.list();
      setFriends(response.data.friends);
      setPendingRequests(response.data.pending_requests);
    } catch (error) {
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const response = await friendsAPI.search(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (friendId) => {
    try {
      await friendsAPI.request(friendId);
      toast.success(language === 'hi' ? 'अनुरोध भेजा गया' : 'Request sent');
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await friendsAPI.accept(requestId);
      toast.success(language === 'hi' ? 'स्वीकार किया' : 'Accepted');
      fetchFriends();
    } catch (error) {
      toast.error('Failed');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await friendsAPI.remove(friendId);
      toast.success(language === 'hi' ? 'हटाया गया' : 'Removed');
      setFriends(prev => prev.filter(f => f.id !== friendId));
    } catch (error) {
      toast.error('Failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] main-content">
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 font-['Manrope']">{t('friends')}</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-10 px-4" data-testid="add-friend-btn">
                <UserPlus className="w-5 h-5 mr-2" />{t('addFriend')}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>{t('addFriend')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder={t('searchUsers')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="h-12 rounded-xl bg-slate-50 border-transparent" data-testid="search-input" />
                  <Button onClick={handleSearch} disabled={searching} className="h-12 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl" data-testid="search-btn">
                    {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10"><AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} /><AvatarFallback className="bg-indigo-100 text-indigo-600">{user.name?.charAt(0)}</AvatarFallback></Avatar>
                        <div><p className="font-medium text-slate-900">{user.name}</p><p className="text-sm text-slate-500">{user.email}</p></div>
                      </div>
                      <Button size="sm" onClick={() => handleSendRequest(user.id)} className="bg-indigo-600 hover:bg-indigo-700 rounded-full"><UserPlus className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  {searchResults.length === 0 && searchQuery && !searching && <p className="text-center text-slate-500 py-4">{t('noResults')}</p>}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 font-['Manrope'] mb-4">{t('pendingRequests')} ({pendingRequests.length})</h2>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <Card key={request.request_id} className="border-0 shadow-sm rounded-2xl bg-amber-50" data-testid={`pending-${request.request_id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="w-12 h-12"><AvatarImage src={request.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.name}`} /><AvatarFallback className="bg-amber-100 text-amber-600">{request.name?.charAt(0)}</AvatarFallback></Avatar>
                    <div className="flex-1"><p className="font-semibold text-slate-900">{request.name}</p></div>
                    <Button size="icon" onClick={() => handleAcceptRequest(request.request_id)} className="w-10 h-10 bg-green-600 hover:bg-green-700 rounded-full"><Check className="w-5 h-5" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-slate-900 font-['Manrope'] mb-4">{t('myFriends')} ({friends.length})</h2>
        {loading ? (
          <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : friends.length > 0 ? (
          <div className="space-y-3">
            {friends.map((friend, index) => (
              <motion.div key={friend.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="border-0 shadow-sm rounded-2xl" data-testid={`friend-${friend.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="w-12 h-12"><AvatarImage src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`} /><AvatarFallback className="bg-indigo-100 text-indigo-600">{friend.name?.charAt(0)}</AvatarFallback></Avatar>
                    <div className="flex-1"><p className="font-semibold text-slate-900">{friend.name}</p></div>
                    <Button size="icon" variant="ghost" onClick={() => handleRemoveFriend(friend.id)} className="w-10 h-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"><X className="w-5 h-5" /></Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm rounded-2xl"><CardContent className="p-8 text-center"><Users className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">{t('noFriends')}</p></CardContent></Card>
        )}
      </main>
      <MobileNav />
    </div>
  );
}
