-- The waitlist and pre-registration are one step now: builders join the waitlist until registration
-- opens, then register, with their waitlist details filled in. The pinned announcement says so.
update public.announcements
set body = 'Registration is not open yet. Join the waitlist in the app to hear first when it opens: your details carry over to registration.'
where body = 'Registration is not open. Join the waitlist and pre-register in the app so your details are ready.';
