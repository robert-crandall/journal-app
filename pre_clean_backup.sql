--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgresql
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgresql;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgresql
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgresql;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: postgresql
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO postgresql;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: postgresql
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: character_stats; Type: TABLE; Schema: public; Owner: postgresql
--

CREATE TABLE public.character_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    current_xp integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.character_stats OWNER TO postgresql;

--
-- Name: content_tags; Type: TABLE; Schema: public; Owner: postgresql
--

CREATE TABLE public.content_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.content_tags OWNER TO postgresql;

--
-- Name: daily_tasks; Type: TABLE; Schema: public; Owner: postgresql
--

CREATE TABLE public.daily_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experiment_id uuid NOT NULL,
    date timestamp with time zone NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    xp_rewards jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_tasks OWNER TO postgresql;

--
-- Name: experiments; Type: TABLE; Schema: public; Owner: postgresql
--

CREATE TABLE public.experiments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    daily_task_description text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.experiments OWNER TO postgresql;

--
-- Name: journal_character_stats; Type: TABLE; Schema: public; Owner: postgresql
--

CREATE TABLE public.journal_character_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    journal_entry_id uuid NOT NULL,
    character_stat_id uuid NOT NULL,
    xp_gained integer DEFAULT 5 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.journal_character_stats OWNER TO postgresql;

--
-- Name: journal_content_tags; Type: TABLE; Schema: public; Owner: postgresql
--

CREATE TABLE public.journal_content_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    journal_entry_id uuid NOT NULL,
    content_tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.journal_content_tags OWNER TO postgresql;

--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: postgresql
--

CREATE TABLE public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255),
    summary text,
    synopsis text,
    conversation_data jsonb NOT NULL,
    entry_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.journal_entries OWNER TO postgresql;

--
-- Name: journal_experiments; Type: TABLE; Schema: public; Owner: postgresql
--

CREATE TABLE public.journal_experiments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    journal_entry_id uuid NOT NULL,
    experiment_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.journal_experiments OWNER TO postgresql;

--
-- Name: journal_tone_tags; Type: TABLE; Schema: public; Owner: postgresql
--

CREATE TABLE public.journal_tone_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    journal_entry_id uuid NOT NULL,
    tone_tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.journal_tone_tags OWNER TO postgresql;

--
-- Name: tone_tags; Type: TABLE; Schema: public; Owner: postgresql
--

CREATE TABLE public.tone_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tone_tags OWNER TO postgresql;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgresql
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    name character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgresql;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgresql
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgresql
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	fc89cf764099c47f5269d273c09aba9bfb8c832993f9b4e100d6c73df0c12490	1749776456541
\.


--
-- Data for Name: character_stats; Type: TABLE DATA; Schema: public; Owner: postgresql
--

COPY public.character_stats (id, user_id, name, description, current_xp, created_at, updated_at) FROM stdin;
e69635ce-5c70-48c0-a22f-cbc45fe9032e	b38d52db-9843-4cad-87a3-0765221801c7	Strength	Physical fitness, endurance, and overall health	5	2025-06-13 21:00:27.860435-07	2025-06-13 21:04:58.921-07
\.


--
-- Data for Name: content_tags; Type: TABLE DATA; Schema: public; Owner: postgresql
--

COPY public.content_tags (id, user_id, name, created_at) FROM stdin;
01326a3b-00bd-42ef-b08f-52a65e2361c1	b38d52db-9843-4cad-87a3-0765221801c7	technology	2025-06-13 09:59:21.581366-07
57655824-8b6e-4684-bd0a-1df5e3eaa35c	b38d52db-9843-4cad-87a3-0765221801c7	app development	2025-06-13 09:59:21.626947-07
ad888c13-8661-4cb7-88e5-b2bf80287938	b38d52db-9843-4cad-87a3-0765221801c7	communication	2025-06-13 09:59:21.665645-07
ef28c883-ed37-4085-9b49-7163a8227ad4	b38d52db-9843-4cad-87a3-0765221801c7	frustration	2025-06-13 09:59:21.702479-07
df58f2d5-f579-41fe-9add-4b68d2064720	b38d52db-9843-4cad-87a3-0765221801c7	wellness	2025-06-13 20:25:35.095697-07
97c60539-61dc-4a8d-bb9b-dad62593d22a	b38d52db-9843-4cad-87a3-0765221801c7	health	2025-06-13 20:25:35.15248-07
27437d21-c98a-4d5c-9533-0c881ba65be5	b38d52db-9843-4cad-87a3-0765221801c7	nutrition	2025-06-13 20:25:35.186865-07
ed45a5d7-2ced-4336-a73e-50736b80f5ad	b38d52db-9843-4cad-87a3-0765221801c7	routine	2025-06-13 20:25:35.222188-07
a86ffa74-3995-469c-910b-5d2767d15c0b	b38d52db-9843-4cad-87a3-0765221801c7	energy	2025-06-13 20:25:35.255607-07
a02eb0ee-62b0-4a71-8293-4ef9effc0662	b38d52db-9843-4cad-87a3-0765221801c7	family	2025-06-13 21:04:58.837437-07
894a2e00-b851-4847-bc42-910d2de445c1	b38d52db-9843-4cad-87a3-0765221801c7	work	2025-06-13 21:04:58.879657-07
b6e823b2-89b3-43e0-8cb2-b5afc3bc53dc	b38d52db-9843-4cad-87a3-0765221801c7	errands	2025-06-13 21:04:58.912222-07
\.


--
-- Data for Name: daily_tasks; Type: TABLE DATA; Schema: public; Owner: postgresql
--

COPY public.daily_tasks (id, experiment_id, date, completed, completed_at, xp_rewards, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: experiments; Type: TABLE DATA; Schema: public; Owner: postgresql
--

COPY public.experiments (id, user_id, title, description, start_date, end_date, daily_task_description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: journal_character_stats; Type: TABLE DATA; Schema: public; Owner: postgresql
--

COPY public.journal_character_stats (id, journal_entry_id, character_stat_id, xp_gained, created_at) FROM stdin;
ce8dcd76-2dcd-45aa-831d-828620393e07	f4927d8e-2376-4675-8f4b-9d863cea772a	e69635ce-5c70-48c0-a22f-cbc45fe9032e	5	2025-06-13 21:04:59.007187-07
\.


--
-- Data for Name: journal_content_tags; Type: TABLE DATA; Schema: public; Owner: postgresql
--

COPY public.journal_content_tags (id, journal_entry_id, content_tag_id, created_at) FROM stdin;
f76c87ed-3a2a-4888-9dd0-ea91645394ad	129e2bba-7967-4cc8-b968-cf5d23ce0947	01326a3b-00bd-42ef-b08f-52a65e2361c1	2025-06-13 09:59:21.598213-07
12c4d97f-5687-4345-a17d-dcd145721144	129e2bba-7967-4cc8-b968-cf5d23ce0947	57655824-8b6e-4684-bd0a-1df5e3eaa35c	2025-06-13 09:59:21.643649-07
f27366e8-4776-4d8a-9a0c-fb3278c7da04	129e2bba-7967-4cc8-b968-cf5d23ce0947	ad888c13-8661-4cb7-88e5-b2bf80287938	2025-06-13 09:59:21.680319-07
80f22524-61ea-4c1e-b5dc-a294662b839e	129e2bba-7967-4cc8-b968-cf5d23ce0947	ef28c883-ed37-4085-9b49-7163a8227ad4	2025-06-13 09:59:21.715252-07
41f79cd7-d8d6-4e48-ae82-96b7787f8a85	67ab9551-7568-49a6-83ee-41e273a63f83	df58f2d5-f579-41fe-9add-4b68d2064720	2025-06-13 20:25:35.121859-07
ecd758c4-4a00-4204-9f32-f9d3aa067d73	67ab9551-7568-49a6-83ee-41e273a63f83	97c60539-61dc-4a8d-bb9b-dad62593d22a	2025-06-13 20:25:35.163886-07
db6fe4f2-7958-4194-8c01-d6633dde7e50	67ab9551-7568-49a6-83ee-41e273a63f83	27437d21-c98a-4d5c-9533-0c881ba65be5	2025-06-13 20:25:35.198557-07
3e8bb557-87c0-46ea-b893-4277ff4fe391	67ab9551-7568-49a6-83ee-41e273a63f83	ed45a5d7-2ced-4336-a73e-50736b80f5ad	2025-06-13 20:25:35.234474-07
200a654f-9d65-4d99-8239-dc132956a97c	67ab9551-7568-49a6-83ee-41e273a63f83	a86ffa74-3995-469c-910b-5d2767d15c0b	2025-06-13 20:25:35.267933-07
186bf0d8-f5c4-45e4-9465-11dc905b6a98	f4927d8e-2376-4675-8f4b-9d863cea772a	97c60539-61dc-4a8d-bb9b-dad62593d22a	2025-06-13 21:04:58.792442-07
d8216cfc-5a0d-4444-8afd-3fd8aed8ddb7	f4927d8e-2376-4675-8f4b-9d863cea772a	ed45a5d7-2ced-4336-a73e-50736b80f5ad	2025-06-13 21:04:58.816243-07
4a7eef63-748a-485c-b665-b9532f5e5eb5	f4927d8e-2376-4675-8f4b-9d863cea772a	a02eb0ee-62b0-4a71-8293-4ef9effc0662	2025-06-13 21:04:58.850768-07
29495a4c-2c0e-4469-a21d-332655fc735a	f4927d8e-2376-4675-8f4b-9d863cea772a	894a2e00-b851-4847-bc42-910d2de445c1	2025-06-13 21:04:58.889634-07
0a962de8-6b56-4669-8468-8677f5df025c	f4927d8e-2376-4675-8f4b-9d863cea772a	b6e823b2-89b3-43e0-8cb2-b5afc3bc53dc	2025-06-13 21:04:58.923102-07
\.


--
-- Data for Name: journal_entries; Type: TABLE DATA; Schema: public; Owner: postgresql
--

COPY public.journal_entries (id, user_id, title, summary, synopsis, conversation_data, entry_date, created_at, updated_at) FROM stdin;
042901d9-55eb-47f2-913a-9b9726be8d2a	b38d52db-9843-4cad-87a3-0765221801c7	\N	\N	\N	{"messages": [{"role": "user", "content": "Just seeing if you're connected", "timestamp": "2025-06-13T13:32:36.157Z"}], "isComplete": false}	2025-06-13 06:32:36.148-07	2025-06-13 06:32:36.205015-07	2025-06-13 06:32:36.205015-07
09911cbf-5f76-48c4-ab1b-d6c931fd8501	b38d52db-9843-4cad-87a3-0765221801c7	\N	\N	\N	{"messages": [{"role": "user", "content": "Hello, how are you?", "timestamp": "2025-06-13T13:39:40.830Z"}], "isComplete": false}	2025-06-13 06:39:40.824-07	2025-06-13 06:39:40.881234-07	2025-06-13 06:39:40.881234-07
f4927d8e-2376-4675-8f4b-9d863cea772a	b38d52db-9843-4cad-87a3-0765221801c7	Balancing Family Care and Daily Responsibilities	Today was a good day overall. I managed to work out, and Liana did too, though I skipped my usual walk because I had to take Tristan to urgent care. He had fallen on his arm while doing Parkour yesterday and needed X-rays. Thankfully, he's doing fine despite the fall.\n\nBesides that, I handled some on-call work which involved writing up a public incident. I also made a trip to Costco to stock up on food and other essentials. It was a busy day balancing family needs, work duties, and errands, but I got everything done. Now, I'm ready to call it a night.	I took Tristan to urgent care for an arm injury and managed my work and errands, including writing a public incident report and shopping at Costco.	{"messages": [{"role": "user", "content": "Today was a good day. I worked out, Liana did too. I didn't take a walk because I took Tristan to urgent care instead.", "timestamp": "2025-06-14T04:02:03.969Z"}, {"role": "assistant", "content": "It sounds like you had a productive day, but taking Tristan to urgent care must have been stressful. How is he doing now?", "timestamp": "2025-06-14T04:02:05.618Z"}, {"role": "user", "content": "He's doing fine. He needed Xrays for his arm, he fell on it in Parkour yesterday.", "timestamp": "2025-06-14T04:03:33.705Z"}, {"role": "assistant", "content": "I'm glad to hear he's doing fine despite the fall. How are you feeling about managing everything with Tristan's injury and your own routine?", "timestamp": "2025-06-14T04:03:34.824Z"}, {"role": "user", "content": "THat wasn't a problem. There was some on-call work. Had to write up a public incident. Other than that, went to Costco to get more food and stuff. I think that's everything, goodnight!", "timestamp": "2025-06-14T04:04:48.058Z"}, {"role": "assistant", "content": "It sounds like you handled a lot today with work, errands, and family—how do you usually unwind after such a busy day?", "timestamp": "2025-06-14T04:04:49.164Z"}, {"role": "user", "content": "Goodnight", "timestamp": "2025-06-14T04:04:54.366Z"}], "isComplete": true}	2025-06-13 21:02:03.964-07	2025-06-13 21:02:04.050325-07	2025-06-13 21:04:58.688-07
129e2bba-7967-4cc8-b968-cf5d23ce0947	b38d52db-9843-4cad-87a3-0765221801c7	Testing Connection While Building My App	Today, I found myself repeatedly checking if the assistant was really there and listening to me. I kept asking if it could hear me and if it understood what I was saying, which reflected my need for connection and reassurance. I was also reflecting on what small actions I could take to make my goals feel more achievable, even as doubts and thoughts about the process crept in.\n\nThe reason behind this was that I was working on an app that talks to GPT, and it wasn’t working as expected. That frustration made me want to test the responsiveness of the assistant, to see if it was truly engaged. After some back and forth, I finally finished what I needed to do and said goodbye, feeling a mix of relief and closure.	I was testing if the assistant was responsive while working on an app that talks to GPT, feeling some frustration but ultimately finishing my task.	{"messages": [{"role": "user", "content": "Are you there?", "timestamp": "2025-06-13T13:43:41.039Z"}, {"role": "user", "content": "Can you hear me?", "timestamp": "2025-06-13T15:30:43.305Z"}, {"role": "assistant", "content": "What’s one small action you can take today to make your goals feel more achievable?", "timestamp": "2025-06-13T15:30:44.121Z"}, {"role": "user", "content": "I... are you really there?", "timestamp": "2025-06-13T15:31:06.449Z"}, {"role": "assistant", "content": "What thoughts or doubts are coming up for you right now that might be influencing your sense of connection?", "timestamp": "2025-06-13T15:31:07.321Z"}, {"role": "user", "content": "Are you listening to me?", "timestamp": "2025-06-13T15:32:53.475Z"}, {"role": "assistant", "content": "What would help you feel more heard or understood in this conversation right now?", "timestamp": "2025-06-13T15:32:55.475Z"}, {"role": "user", "content": "I am testing if you're around now", "timestamp": "2025-06-13T16:58:43.378Z"}, {"role": "assistant", "content": "It sounds like you’re checking in to see how responsive I am—what’s on your mind that’s making you feel the need to test this connection?", "timestamp": "2025-06-13T16:58:45.053Z"}, {"role": "user", "content": "Well, I'm writing an app that talks to GPT and it wasn't working!", "timestamp": "2025-06-13T16:58:58.616Z"}, {"role": "assistant", "content": "That sounds frustrating—how are you feeling about the progress you’ve made so far with your app?", "timestamp": "2025-06-13T16:58:59.254Z"}, {"role": "user", "content": "I'm done now. Goodbye.", "timestamp": "2025-06-13T16:59:16.931Z"}], "isComplete": true}	2025-06-13 06:43:41.025-07	2025-06-13 06:43:41.075384-07	2025-06-13 09:59:21.497-07
36f47ea6-7171-4b5d-ab21-e363878073ad	b38d52db-9843-4cad-87a3-0765221801c7	\N	\N	\N	{"messages": [{"role": "user", "content": "Hey, how's it going?", "timestamp": "2025-06-14T03:37:14.796Z"}, {"role": "assistant", "content": "Hey! I’m here and ready to chat—how about you? What’s been on your mind lately?", "timestamp": "2025-06-14T03:39:09.764Z"}], "isComplete": false}	2025-06-13 20:37:14.793-07	2025-06-13 20:37:14.890233-07	2025-06-13 20:39:09.764-07
16bc68f7-fda6-44df-9d16-272cec555077	b38d52db-9843-4cad-87a3-0765221801c7	\N	\N	\N	{"messages": [{"role": "user", "content": "Just wondering what this form looks like now", "timestamp": "2025-06-14T03:25:14.839Z"}, {"role": "assistant", "content": "It sounds like you’re checking in on something specific—what kind of form are you referring to, and what are you hoping to see or change about it?", "timestamp": "2025-06-14T03:25:16.743Z"}], "isComplete": false}	2025-06-13 20:25:14.833-07	2025-06-13 20:25:14.928816-07	2025-06-13 20:25:16.743-07
67ab9551-7568-49a6-83ee-41e273a63f83	b38d52db-9843-4cad-87a3-0765221801c7	Feeling Better and Trying New Wellness Strategies	I'm feeling pretty good today, which is a noticeable improvement compared to the past couple of weeks. Last night, I was happy and energetic while playing with Dylan, which felt really positive. Yesterday, I had heavy cream and initially felt nauseated, but after taking a walk, I started to feel better. Maybe the walk helped ease the nausea, and that could be a key to feeling better.\n\nToday, I introduced KPV into my routine with a plan to try it for two weeks on and one week off. I'm hopeful that this new approach will positively impact my well-being. Overall, the progress I've noticed and the new strategies I'm trying give me some optimism about feeling better moving forward.	I felt happy and energetic playing with Dylan last night, noticed improvement over the past two weeks, and tried heavy cream which initially caused nausea but improved after walking. Today, I introduced KPV with a plan to cycle it for two weeks on and one week off.	{"messages": [{"role": "user", "content": "I'm feeling pretty good about today. I noticed I was happy playing with Dylan last night, happy and energetic. This is quite the improvement over the past 2 weeks. I did have heavy cream yesterday. I was nauseated at first, but after walking I felt better. Maybe that's the key?", "timestamp": "2025-06-14T00:06:09.575Z"}, {"role": "user", "content": "Today I'm feeling pretty good too. I introduced KPV. I'm hoping to try this 2 weeks on, then 1 week off.", "timestamp": "2025-06-14T00:06:48.092Z"}, {"role": "assistant", "content": "It’s great to hear you’re feeling good and trying out KPV with a plan in mind. What inspired you to introduce KPV, and how are you hoping it will impact your well-being?", "timestamp": "2025-06-14T00:06:49.804Z"}, {"role": "user", "content": "Goodbye", "timestamp": "2025-06-14T03:25:29.673Z"}], "isComplete": true}	2025-06-13 17:06:09.569-07	2025-06-13 17:06:09.643541-07	2025-06-13 20:25:34.971-07
2d4f94d5-ef4b-4b6b-8018-4f4f8ba9fbba	b38d52db-9843-4cad-87a3-0765221801c7	\N	\N	\N	{"messages": [{"role": "user", "content": "Hey, how's it going?", "timestamp": "2025-06-14T03:36:48.353Z"}, {"role": "user", "content": "Can you hear me?", "timestamp": "2025-06-14T03:37:01.754Z"}, {"role": "assistant", "content": "I hear you loud and clear! What’s been on your mind today?", "timestamp": "2025-06-14T03:37:04.196Z"}], "isComplete": false}	2025-06-13 20:36:48.349-07	2025-06-13 20:36:48.459017-07	2025-06-13 20:37:04.196-07
22084271-a97f-4b61-87f9-5153df614fa2	b38d52db-9843-4cad-87a3-0765221801c7	\N	\N	\N	{"messages": [{"role": "user", "content": "Hey, how are you today?", "timestamp": "2025-06-14T03:41:19.321Z"}, {"role": "assistant", "content": "I'm doing well, thanks for asking! How about you—what's been on your mind today?", "timestamp": "2025-06-14T03:41:20.493Z"}], "isComplete": false}	2025-06-13 20:41:19.316-07	2025-06-13 20:41:19.416874-07	2025-06-13 20:41:20.493-07
\.


--
-- Data for Name: journal_experiments; Type: TABLE DATA; Schema: public; Owner: postgresql
--

COPY public.journal_experiments (id, journal_entry_id, experiment_id, created_at) FROM stdin;
\.


--
-- Data for Name: journal_tone_tags; Type: TABLE DATA; Schema: public; Owner: postgresql
--

COPY public.journal_tone_tags (id, journal_entry_id, tone_tag_id, created_at) FROM stdin;
83d735fe-4971-4b89-9d5f-c62ab3bff75d	129e2bba-7967-4cc8-b968-cf5d23ce0947	e97d71cd-826f-4bc4-8931-19803daa622a	2025-06-13 09:59:21.735737-07
71858119-018a-4387-baf9-da6b48e9b04a	129e2bba-7967-4cc8-b968-cf5d23ce0947	61a4c2a3-15cd-49b2-b385-8c8e1a8e153b	2025-06-13 09:59:21.759692-07
fa36a6ce-1ae7-4185-9030-9a39d191e296	67ab9551-7568-49a6-83ee-41e273a63f83	e4905464-cad9-435e-b469-a4127b795879	2025-06-13 20:25:35.288312-07
df672325-5a58-44eb-be1a-7ea4392c9f19	67ab9551-7568-49a6-83ee-41e273a63f83	47192dbf-bd77-41fc-815c-a2cb749223de	2025-06-13 20:25:35.315332-07
139e3f05-a333-4bc1-b27a-d137d4de9c4a	67ab9551-7568-49a6-83ee-41e273a63f83	f90e1ea8-e63a-4a02-8930-1cb8460690cd	2025-06-13 20:25:35.341499-07
59bcc664-07d0-48fd-a369-84511cc51ffc	f4927d8e-2376-4675-8f4b-9d863cea772a	e4905464-cad9-435e-b469-a4127b795879	2025-06-13 21:04:58.944522-07
6f0f2750-1026-4fd5-8c47-ae7970f124b3	f4927d8e-2376-4675-8f4b-9d863cea772a	8208bc5e-0f43-48c7-9092-ced68c5dc987	2025-06-13 21:04:58.968168-07
\.


--
-- Data for Name: tone_tags; Type: TABLE DATA; Schema: public; Owner: postgresql
--

COPY public.tone_tags (id, name, description, created_at) FROM stdin;
a7ec755a-962f-45c0-83f9-de99e94d71dd	calm	Peaceful and relaxed state of mind	2025-06-13 07:33:27.926201-07
1037e164-c49a-4250-bb37-604b315ad0f1	overwhelmed	Feeling of being swamped or stressed	2025-06-13 07:33:27.941633-07
e97d71cd-826f-4bc4-8931-19803daa622a	frustrated	Feeling of anger or annoyance	2025-06-13 07:33:27.950116-07
602224be-57b0-4c19-820b-880601a86141	excited	Feeling of enthusiasm and energy	2025-06-13 07:33:27.957985-07
61a4c2a3-15cd-49b2-b385-8c8e1a8e153b	anxious	Feeling of worry or unease	2025-06-13 07:33:27.96621-07
8208bc5e-0f43-48c7-9092-ced68c5dc987	focused	State of concentrated attention	2025-06-13 07:33:27.977874-07
1709df82-b8bc-4d4d-9d5b-0822685390a6	scattered	Feeling unfocused or distracted	2025-06-13 07:33:27.991105-07
aabdb61e-67d8-4b06-901a-44f5a8bf9ee4	accomplished	Feeling of achievement and satisfaction	2025-06-13 07:33:28.000225-07
c58c068f-87fa-4322-89fb-a58dd3f7f5a4	lonely	Feeling of isolation or solitude	2025-06-13 07:33:28.008218-07
f77e85b2-fd0d-4e72-8d13-65e187959660	grateful	Feeling of appreciation and thankfulness	2025-06-13 07:33:28.019585-07
f90e1ea8-e63a-4a02-8930-1cb8460690cd	energetic	Feeling full of energy and vitality	2025-06-13 07:33:28.03163-07
d8bb0737-3173-4064-ab3c-b97c97f96a50	tired	Feeling of exhaustion or fatigue	2025-06-13 07:33:28.044601-07
47192dbf-bd77-41fc-815c-a2cb749223de	optimistic	Feeling hopeful about the future	2025-06-13 07:33:28.057706-07
495d7b33-031d-48eb-8f24-63cde421ad57	pessimistic	Feeling negative about outcomes	2025-06-13 07:33:28.066826-07
e4905464-cad9-435e-b469-a4127b795879	content	Feeling satisfied and at peace	2025-06-13 07:33:28.077638-07
e61a2c8e-1c09-4554-a746-73b88f506cfb	restless	Feeling unable to stay still or relax	2025-06-13 07:33:28.088971-07
57c39d65-071b-4951-ae28-74514404c9f5	confident	Feeling self-assured and certain	2025-06-13 07:33:28.104028-07
84e8cf83-0307-488e-80f5-685c8a9f6cf1	doubtful	Feeling uncertain or questioning	2025-06-13 07:33:28.112482-07
9762bf69-8ddd-4267-a89e-eaf8662c5e6c	creative	Feeling imaginative and innovative	2025-06-13 07:33:28.123332-07
74c3883a-6fea-4ae8-bc64-a022200ef33e	blocked	Feeling stuck or unable to progress	2025-06-13 07:33:28.132199-07
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgresql
--

COPY public.users (id, email, password_hash, name, created_at, updated_at) FROM stdin;
28fdd890-8ca9-4999-80e1-1951afc6683c	test@example.com	$2b$12$70280nzVPJNvo5jURLsxWO2.f3dhbmTZTqhD1xAOwVDlyEyX7K3be	Test User	2025-06-15 06:46:11.631971-07	2025-06-15 06:46:11.631971-07
b38d52db-9843-4cad-87a3-0765221801c7	robert.crandall@gmail.com	$2b$12$SDxonEvZir/.TTprWZ5SX.PFjS5LvkFwwHJ.iJ0QLsPI3imtA1Mgq	Robie	2025-06-12 20:32:09.445459-07	2025-06-12 20:32:09.445459-07
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgresql
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgresql
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: character_stats character_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.character_stats
    ADD CONSTRAINT character_stats_pkey PRIMARY KEY (id);


--
-- Name: content_tags content_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.content_tags
    ADD CONSTRAINT content_tags_pkey PRIMARY KEY (id);


--
-- Name: daily_tasks daily_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.daily_tasks
    ADD CONSTRAINT daily_tasks_pkey PRIMARY KEY (id);


--
-- Name: experiments experiments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.experiments
    ADD CONSTRAINT experiments_pkey PRIMARY KEY (id);


--
-- Name: journal_character_stats journal_character_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_character_stats
    ADD CONSTRAINT journal_character_stats_pkey PRIMARY KEY (id);


--
-- Name: journal_content_tags journal_content_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_content_tags
    ADD CONSTRAINT journal_content_tags_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journal_experiments journal_experiments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_experiments
    ADD CONSTRAINT journal_experiments_pkey PRIMARY KEY (id);


--
-- Name: journal_tone_tags journal_tone_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_tone_tags
    ADD CONSTRAINT journal_tone_tags_pkey PRIMARY KEY (id);


--
-- Name: tone_tags tone_tags_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.tone_tags
    ADD CONSTRAINT tone_tags_name_unique UNIQUE (name);


--
-- Name: tone_tags tone_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.tone_tags
    ADD CONSTRAINT tone_tags_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: character_stats character_stats_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.character_stats
    ADD CONSTRAINT character_stats_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: content_tags content_tags_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.content_tags
    ADD CONSTRAINT content_tags_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: daily_tasks daily_tasks_experiment_id_experiments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.daily_tasks
    ADD CONSTRAINT daily_tasks_experiment_id_experiments_id_fk FOREIGN KEY (experiment_id) REFERENCES public.experiments(id) ON DELETE CASCADE;


--
-- Name: experiments experiments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.experiments
    ADD CONSTRAINT experiments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: journal_character_stats journal_character_stats_character_stat_id_character_stats_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_character_stats
    ADD CONSTRAINT journal_character_stats_character_stat_id_character_stats_id_fk FOREIGN KEY (character_stat_id) REFERENCES public.character_stats(id) ON DELETE CASCADE;


--
-- Name: journal_character_stats journal_character_stats_journal_entry_id_journal_entries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_character_stats
    ADD CONSTRAINT journal_character_stats_journal_entry_id_journal_entries_id_fk FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE;


--
-- Name: journal_content_tags journal_content_tags_content_tag_id_content_tags_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_content_tags
    ADD CONSTRAINT journal_content_tags_content_tag_id_content_tags_id_fk FOREIGN KEY (content_tag_id) REFERENCES public.content_tags(id) ON DELETE CASCADE;


--
-- Name: journal_content_tags journal_content_tags_journal_entry_id_journal_entries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_content_tags
    ADD CONSTRAINT journal_content_tags_journal_entry_id_journal_entries_id_fk FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE;


--
-- Name: journal_entries journal_entries_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: journal_experiments journal_experiments_experiment_id_experiments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_experiments
    ADD CONSTRAINT journal_experiments_experiment_id_experiments_id_fk FOREIGN KEY (experiment_id) REFERENCES public.experiments(id) ON DELETE CASCADE;


--
-- Name: journal_experiments journal_experiments_journal_entry_id_journal_entries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_experiments
    ADD CONSTRAINT journal_experiments_journal_entry_id_journal_entries_id_fk FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE;


--
-- Name: journal_tone_tags journal_tone_tags_journal_entry_id_journal_entries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_tone_tags
    ADD CONSTRAINT journal_tone_tags_journal_entry_id_journal_entries_id_fk FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE;


--
-- Name: journal_tone_tags journal_tone_tags_tone_tag_id_tone_tags_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgresql
--

ALTER TABLE ONLY public.journal_tone_tags
    ADD CONSTRAINT journal_tone_tags_tone_tag_id_tone_tags_id_fk FOREIGN KEY (tone_tag_id) REFERENCES public.tone_tags(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

