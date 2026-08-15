--
-- PostgreSQL database dump
--

\restrict 7xhlgpsYygkCM7bpyKhxg87fXi2m2GfaaDq8qbkr55HagrepbGE0yeMa60YddUu

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
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.banners DISABLE TRIGGER ALL;

INSERT INTO public.banners (id, title, subtitle, description, image, link, "order", is_active, created_at, updated_at) VALUES (2, 'Trendy', '', '', 'https://res.cloudinary.com/dayy6ryhw/image/upload/v1782112062/banners/sebkuujw6vmrpsslftup.png', '/shop', 0, true, '2026-06-22 12:37:43.139272+05:30', '2026-06-22 12:37:43.139304+05:30');


ALTER TABLE public.banners ENABLE TRIGGER ALL;

--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.categories DISABLE TRIGGER ALL;

INSERT INTO public.categories (id, name, slug, category_type, image, description, is_active, created_at, updated_at) VALUES (1, 'Hoodies', 'hoodies', 'hoodies', '', NULL, true, '2026-06-13 15:34:09.192952+05:30', '2026-06-13 15:34:09.192963+05:30');
INSERT INTO public.categories (id, name, slug, category_type, image, description, is_active, created_at, updated_at) VALUES (2, 'T-Shirts', 'tshirts', 'tshirts', '', NULL, true, '2026-06-13 15:34:09.207792+05:30', '2026-06-13 15:34:09.207801+05:30');
INSERT INTO public.categories (id, name, slug, category_type, image, description, is_active, created_at, updated_at) VALUES (3, 'Shirts', 'shirts', 'shirts', '', NULL, true, '2026-06-13 15:34:09.209251+05:30', '2026-06-13 15:34:09.209259+05:30');
INSERT INTO public.categories (id, name, slug, category_type, image, description, is_active, created_at, updated_at) VALUES (4, 'Pants', 'pants', 'pants', '', NULL, true, '2026-06-13 15:34:09.210438+05:30', '2026-06-13 15:34:09.210446+05:30');
INSERT INTO public.categories (id, name, slug, category_type, image, description, is_active, created_at, updated_at) VALUES (5, 'Bottomwear', 'bottomwear', 'bottomwear', '', NULL, true, '2026-06-13 15:34:09.21199+05:30', '2026-06-13 15:34:09.211998+05:30');
INSERT INTO public.categories (id, name, slug, category_type, image, description, is_active, created_at, updated_at) VALUES (6, 'Accessories', 'accessories', 'accessories', '', NULL, true, '2026-06-13 15:34:09.213492+05:30', '2026-06-13 15:34:09.213499+05:30');
INSERT INTO public.categories (id, name, slug, category_type, image, description, is_active, created_at, updated_at) VALUES (7, 'Shoes', 'shoes', 'shoes', '', NULL, true, '2026-06-13 15:34:09.214786+05:30', '2026-06-13 15:34:09.214792+05:30');


ALTER TABLE public.categories ENABLE TRIGGER ALL;

--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.products DISABLE TRIGGER ALL;

INSERT INTO public.products (id, name, slug, description, brand, base_price, discount_price, discount_percentage, material, care_instructions, fabric, fit, sleeve, season, total_stock, rating, reviews_count, is_featured, is_new_arrival, is_active, background_color, category_attributes, created_at, updated_at, category_id) VALUES (1, 'Hoodiee', 'hoodiee', 'No description provided', 'pogiee', 999.00, 899.00, 10, 'Cotton', '', '', '', '', '', 10, 0.00, 0, false, true, true, '#f5ebe0', '{}', '2026-06-13 15:49:43.388822+05:30', '2026-06-13 15:49:43.388873+05:30', 1);
INSERT INTO public.products (id, name, slug, description, brand, base_price, discount_price, discount_percentage, material, care_instructions, fabric, fit, sleeve, season, total_stock, rating, reviews_count, is_featured, is_new_arrival, is_active, background_color, category_attributes, created_at, updated_at, category_id) VALUES (2, 'Casual shoes', 'casual-shoes', 'No description provided', 'POGIEE', 1499.00, 1299.00, 13, '', '', '', '', '', '', 10, 0.00, 0, false, true, true, '#f5ebe0', '{"occasion": "Casual", "shoe_type": "Running Shoes", "shoe_category": "Casual Shoes", "sole_material": "PU", "upper_material": "Mesh"}', '2026-06-17 13:54:37.855774+05:30', '2026-06-17 13:57:19.420558+05:30', 7);
INSERT INTO public.products (id, name, slug, description, brand, base_price, discount_price, discount_percentage, material, care_instructions, fabric, fit, sleeve, season, total_stock, rating, reviews_count, is_featured, is_new_arrival, is_active, background_color, category_attributes, created_at, updated_at, category_id) VALUES (3, 'Hoodiee', 'hoodiee-green1', 'No description provided', 'pogiee', 999.00, 599.00, 40, 'Cotton', '', '', '', '', '', 50, 0.00, 0, false, true, true, '#eef4ed', '{}', '2026-06-17 22:33:51.870609+05:30', '2026-06-17 22:33:51.870664+05:30', 1);
INSERT INTO public.products (id, name, slug, description, brand, base_price, discount_price, discount_percentage, material, care_instructions, fabric, fit, sleeve, season, total_stock, rating, reviews_count, is_featured, is_new_arrival, is_active, background_color, category_attributes, created_at, updated_at, category_id) VALUES (4, 'Casual T-shirt', 'casual-t-shirt', 'No description provided', 'pogiee', 699.00, 499.00, 28, 'Cotton Blend', '', '', '', '', '', 50, 0.00, 0, true, false, true, '#f5ebe0', '{"fit": "Regular Fit", "sleeve": "Half Sleeve", "material": "100% Cotton", "use_case": "Casual Wear", "tshirt_type": "Round Neck"}', '2026-06-18 17:01:00.839232+05:30', '2026-06-18 17:01:00.839258+05:30', 2);
INSERT INTO public.products (id, name, slug, description, brand, base_price, discount_price, discount_percentage, material, care_instructions, fabric, fit, sleeve, season, total_stock, rating, reviews_count, is_featured, is_new_arrival, is_active, background_color, category_attributes, created_at, updated_at, category_id) VALUES (5, 'pant', 'pant', 'No description provided', 'pogiee', 1499.00, 1299.00, 13, 'Cotton', '', '', '', '', '', 20, 0.00, 0, false, true, true, '#ffffff', '{}', '2026-06-18 17:35:06.915715+05:30', '2026-06-18 17:35:06.915749+05:30', 4);
INSERT INTO public.products (id, name, slug, description, brand, base_price, discount_price, discount_percentage, material, care_instructions, fabric, fit, sleeve, season, total_stock, rating, reviews_count, is_featured, is_new_arrival, is_active, background_color, category_attributes, created_at, updated_at, category_id) VALUES (6, 'Trousers', 'trousers-mqp7ilig', 'No description provided', 'POGIEE', 999.00, 799.00, 20, '', '', '', '', '', '', 49, 0.00, 0, false, true, true, '#f5ebe0', '{}', '2026-06-22 18:14:50.291678+05:30', '2026-06-22 18:14:50.292122+05:30', 5);


ALTER TABLE public.products ENABLE TRIGGER ALL;

--
-- Data for Name: color_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.color_variants DISABLE TRIGGER ALL;

INSERT INTO public.color_variants (id, color_name, color_hex, sku, price_adjustment, is_default, is_active, created_at, updated_at, product_id) VALUES (1, 'Tan', '#d2bea0', '1-TAN', 0.00, true, true, '2026-06-13 15:49:43.468673+05:30', '2026-06-13 15:49:43.468684+05:30', 1);
INSERT INTO public.color_variants (id, color_name, color_hex, sku, price_adjustment, is_default, is_active, created_at, updated_at, product_id) VALUES (2, 'Lavender', '#e6e6f0', '2-LAVENDER', 0.00, true, true, '2026-06-17 13:54:37.971979+05:30', '2026-06-17 13:54:37.972005+05:30', 2);
INSERT INTO public.color_variants (id, color_name, color_hex, sku, price_adjustment, is_default, is_active, created_at, updated_at, product_id) VALUES (3, 'Dark Olive Green', 'green', '3-DARK-OLIVE-GREEN', 0.00, true, true, '2026-06-17 22:33:51.998257+05:30', '2026-06-17 22:33:51.998275+05:30', 3);
INSERT INTO public.color_variants (id, color_name, color_hex, sku, price_adjustment, is_default, is_active, created_at, updated_at, product_id) VALUES (4, 'Dark Slate Gray', '#282828', '4-DARK-SLATE-GRAY', 0.00, true, true, '2026-06-18 17:01:00.953094+05:30', '2026-06-18 17:01:00.953113+05:30', 4);
INSERT INTO public.color_variants (id, color_name, color_hex, sku, price_adjustment, is_default, is_active, created_at, updated_at, product_id) VALUES (5, 'Sienna', '#825a46', '5-SIENNA', 0.00, true, true, '2026-06-18 17:35:07.026629+05:30', '2026-06-18 17:35:07.026654+05:30', 5);
INSERT INTO public.color_variants (id, color_name, color_hex, sku, price_adjustment, is_default, is_active, created_at, updated_at, product_id) VALUES (6, 'Dark Gray', '#b4aa96', '6-DARK-GRAY', 0.00, true, true, '2026-06-22 18:14:50.435459+05:30', '2026-06-22 18:14:50.435484+05:30', 6);


ALTER TABLE public.color_variants ENABLE TRIGGER ALL;

--
-- Data for Name: promotional_banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.promotional_banners DISABLE TRIGGER ALL;

INSERT INTO public.promotional_banners (id, title, subtitle, discount_text, description, button_text, button_link, image, background_color, "order", is_active, created_at, updated_at) VALUES (3, 'TRENDY DAY', '', '', '', 'Shop Now', '/shop', 'https://res.cloudinary.com/dayy6ryhw/image/upload/v1782130010/promotional_banners/qib5spadctlegsdgxl7u.jpg', '#f8f8f8', 0, true, '2026-06-22 17:36:49.243242+05:30', '2026-06-22 17:36:49.243302+05:30');


ALTER TABLE public.promotional_banners ENABLE TRIGGER ALL;

--
-- Data for Name: size_stocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.size_stocks DISABLE TRIGGER ALL;

INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (21, '28', 5, '2026-06-18 17:35:12.951789+05:30', '2026-06-18 17:35:12.95181+05:30', 5, '5-SIENNA-28');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (25, '28', 10, '2026-06-22 18:14:53.617316+05:30', '2026-06-22 18:14:53.61735+05:30', 6, '6-DARK-GRAY-28');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (26, '30', 10, '2026-06-22 18:14:53.729731+05:30', '2026-06-22 18:14:53.729753+05:30', 6, '6-DARK-GRAY-30');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (22, '30', 5, '2026-06-18 17:35:13.132962+05:30', '2026-06-18 17:35:13.13299+05:30', 5, '5-SIENNA-30');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (27, '32', 10, '2026-06-22 18:14:53.821265+05:30', '2026-06-22 18:14:53.821286+05:30', 6, '6-DARK-GRAY-32');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (23, '32', 5, '2026-06-18 17:35:13.226986+05:30', '2026-06-18 17:35:13.227017+05:30', 5, '5-SIENNA-32');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (24, '34', 4, '2026-06-18 17:35:13.349599+05:30', '2026-06-18 17:35:13.349637+05:30', 5, '5-SIENNA-34');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (28, '34', 10, '2026-06-22 18:14:53.908168+05:30', '2026-06-22 18:14:53.908194+05:30', 6, '6-DARK-GRAY-34');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (29, '36', 5, '2026-06-22 18:14:54.000489+05:30', '2026-06-22 18:14:54.000593+05:30', 6, '6-DARK-GRAY-36');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (30, '38', 4, '2026-06-22 18:14:54.086909+05:30', '2026-06-22 18:14:54.086924+05:30', 6, '6-DARK-GRAY-38');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (3, 'L', 10, '2026-06-13 15:49:54.856178+05:30', '2026-06-13 15:49:54.856188+05:30', 1, '1-TAN-L');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (18, 'L', 10, '2026-06-18 17:01:04.309549+05:30', '2026-06-18 17:01:04.309565+05:30', 4, '4-DARK-SLATE-GRAY-L');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (13, 'L', 10, '2026-06-17 22:33:53.960889+05:30', '2026-06-17 22:33:53.960909+05:30', 3, '3-DARK-OLIVE-GREEN-L');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (12, 'M', 10, '2026-06-17 22:33:53.861464+05:30', '2026-06-17 22:33:53.861487+05:30', 3, '3-DARK-OLIVE-GREEN-M');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (2, 'M', 10, '2026-06-13 15:49:54.789873+05:30', '2026-06-13 15:49:54.789886+05:30', 1, '1-TAN-M');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (17, 'M', 10, '2026-06-18 17:01:04.217525+05:30', '2026-06-18 17:01:04.217545+05:30', 4, '4-DARK-SLATE-GRAY-M');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (16, 'S', 10, '2026-06-18 17:01:04.123937+05:30', '2026-06-18 17:01:04.123955+05:30', 4, '4-DARK-SLATE-GRAY-S');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (11, 'S', 10, '2026-06-17 22:33:53.654987+05:30', '2026-06-17 22:33:53.655009+05:30', 3, '3-DARK-OLIVE-GREEN-S');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (1, 'S', 10, '2026-06-13 15:49:54.719111+05:30', '2026-06-13 15:49:54.719132+05:30', 1, '1-TAN-S');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (6, 'UK 5', 5, '2026-06-17 13:54:42.491541+05:30', '2026-06-17 13:54:42.491562+05:30', 2, '2-LAVENDER-UK 5');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (7, 'UK 6', 10, '2026-06-17 13:54:42.590398+05:30', '2026-06-17 13:54:42.590419+05:30', 2, '2-LAVENDER-UK 6');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (8, 'UK 7', 20, '2026-06-17 13:54:42.686703+05:30', '2026-06-17 13:54:42.686726+05:30', 2, '2-LAVENDER-UK 7');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (9, 'UK 8', 10, '2026-06-17 13:54:42.78087+05:30', '2026-06-17 13:54:42.78089+05:30', 2, '2-LAVENDER-UK 8');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (10, 'UK 9', 10, '2026-06-17 13:54:42.872958+05:30', '2026-06-17 13:54:42.87306+05:30', 2, '2-LAVENDER-UK 9');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (4, 'XL', 10, '2026-06-13 15:49:54.908474+05:30', '2026-06-13 15:49:54.908484+05:30', 1, '1-TAN-XL');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (19, 'XL', 10, '2026-06-18 17:01:04.399673+05:30', '2026-06-18 17:01:04.399691+05:30', 4, '4-DARK-SLATE-GRAY-XL');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (14, 'XL', 10, '2026-06-17 22:33:54.062934+05:30', '2026-06-17 22:33:54.062955+05:30', 3, '3-DARK-OLIVE-GREEN-XL');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (15, 'XXL', 10, '2026-06-17 22:33:54.165367+05:30', '2026-06-17 22:33:54.165388+05:30', 3, '3-DARK-OLIVE-GREEN-XXL');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (5, 'XXL', 5, '2026-06-13 15:49:55.062618+05:30', '2026-06-13 15:49:55.062627+05:30', 1, '1-TAN-XXL');
INSERT INTO public.size_stocks (id, size, quantity, created_at, updated_at, variant_id, sku) VALUES (20, 'XXL', 9, '2026-06-18 17:01:04.492976+05:30', '2026-06-18 17:01:04.493001+05:30', 4, '4-DARK-SLATE-GRAY-XXL');


ALTER TABLE public.size_stocks ENABLE TRIGGER ALL;

--
-- Name: banners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.banners_id_seq', 2, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 7, true);


--
-- Name: color_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.color_variants_id_seq', 6, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 6, true);


--
-- Name: promotional_banners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promotional_banners_id_seq', 3, true);


--
-- Name: size_stocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.size_stocks_id_seq', 30, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 7xhlgpsYygkCM7bpyKhxg87fXi2m2GfaaDq8qbkr55HagrepbGE0yeMa60YddUu

