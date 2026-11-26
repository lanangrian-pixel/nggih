(() => {
  let client;

  function getClient() {
    if (!client) {
      const { url, anonKey } = window.supabaseConfig || {};
      if (
        !window.supabase?.createClient ||
        typeof url !== "string" ||
        !url.startsWith("https://") ||
        url.includes("YOUR-PROJECT") ||
        typeof anonKey !== "string" ||
        !anonKey ||
        anonKey.includes("YOUR_SUPABASE_ANON_KEY")
      ) {
        throw new Error("Supabase URL and anon key have not been configured.");
      }
      client = window.supabase.createClient(url, anonKey);
    }
    return client;
  }

  async function fetchMilestones() {
    const { data, error } = await getClient()
      .from("milestones")
      .select("id,week,sort_order,name,description,status")
      .order("week", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data;
  }

  async function updateMilestone(id, changes) {
    const { data, error } = await getClient()
      .from("milestones")
      .update(changes)
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw error;
    return data;
  }

  async function sendSignInLink(email) {
    const { error } = await getClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    if (error) throw error;
  }

  async function getSession() {
    const { data, error } = await getClient().auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function canEdit() {
    const { data, error } = await getClient().rpc("can_edit_milestones");
    if (error) throw error;
    return data === true;
  }

  async function signOut() {
    const { error } = await getClient().auth.signOut();
    if (error) throw error;
  }

  function onAuthStateChange(callback) {
    return getClient().auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => callback(session), 0);
    });
  }

  function subscribe(onChange, onError) {
    let activeClient;
    try {
      activeClient = getClient();
    } catch (error) {
      onError(error);
      return () => {};
    }

    const channel = activeClient
      .channel("milestone-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "milestones" }, onChange)
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          onError(error || new Error(`Supabase realtime subscription status: ${status}`));
        }
      });

    return () => activeClient.removeChannel(channel);
  }

  window.milestoneStore = {
    canEdit,
    fetchMilestones,
    getSession,
    onAuthStateChange,
    sendSignInLink,
    signOut,
    subscribe,
    updateMilestone,
  };
})();
