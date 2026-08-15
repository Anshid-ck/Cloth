--
-- PostgreSQL database dump
--

\restrict HJkYl2SggTp17hBHteAG8ZplyGklsr8rlvpu3jB3bQLe8OXbJgrQyQl21JxDkhr

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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
-- Data for Name: variant_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.variant_images (id, image, alt_text, is_primary, "order", created_at, variant_id) VALUES (1, 'https://res.cloudinary.com/dayy6ryhw/image/upload/v1781345987/variant_images/dqbebarxbl23zbircuig.png', '', true, 0, '2026-06-13 15:49:46.669059+05:30', 1);
INSERT INTO public.variant_images (id, image, alt_text, is_primary, "order", created_at, variant_id) VALUES (2, 'https://res.cloudinary.com/dayy6ryhw/image/upload/v1781345990/variant_images/hpwe2vqeq0vbsmrko0xz.png', '', false, 1, '2026-06-13 15:49:51.02069+05:30', 1);
INSERT INTO public.variant_images (id, image, alt_text, is_primary, "order", created_at, variant_id) VALUES (3, 'https://res.cloudinary.com/dayy6ryhw/image/upload/v1781345994/variant_images/i8dgbmy0caaqjs6gn0nc.png', '', false, 2, '2026-06-13 15:49:54.550385+05:30', 1);
INSERT INTO public.variant_images (id, image, alt_text, is_primary, "order", created_at, variant_id) VALUES (4, 'https://res.cloudinary.com/dayy6ryhw/image/upload/v1781684683/variant_images/ncfhnsbqno2x4tx9bexx.png', '', true, 0, '2026-06-17 13:54:42.271255+05:30', 2);
INSERT INTO public.variant_images (id, image, alt_text, is_primary, "order", created_at, variant_id) VALUES (5, 'https://res.cloudinary.com/dayy6ryhw/image/upload/v1781715832/variant_images/ugulqmeo06p3dl4kakdq.png', '', true, 0, '2026-06-17 22:33:53.531838+05:30', 3);
INSERT INTO public.variant_images (id, image, alt_text, is_primary, "order", created_at, variant_id) VALUES (6, 'https://res.cloudinary.com/dayy6ryhw/image/upload/v1781782266/variant_images/f5hhzvx0ahpyqdeyz3xv.png', '', true, 0, '2026-06-18 17:01:04.005915+05:30', 4);
INSERT INTO public.variant_images (id, image, alt_text, is_primary, "order", created_at, variant_id) VALUES (7, 'https://res.cloudinary.com/dayy6ryhw/image/upload/v1781784314/variant_images/cpbedwb4fhnoz6xdvh4c.png', '', true, 0, '2026-06-18 17:35:12.822422+05:30', 5);
INSERT INTO public.variant_images (id, image, alt_text, is_primary, "order", created_at, variant_id) VALUES (8, 'https://res.cloudinary.com/dayy6ryhw/image/upload/v1782132295/variant_images/y6xznv9zsrca6ayfjrcu.png', '', true, 0, '2026-06-22 18:14:53.471114+05:30', 6);


--
-- Name: variant_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.variant_images_id_seq', 8, true);


--
-- PostgreSQL database dump complete
--

\unrestrict HJkYl2SggTp17hBHteAG8ZplyGklsr8rlvpu3jB3bQLe8OXbJgrQyQl21JxDkhr

