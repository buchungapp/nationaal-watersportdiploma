INSERT INTO "kss"."niveau" ("id", "rang") VALUES
('04512274-469c-4a07-b6e1-b175bd1b3d82', 2),
('34f9a3d9-9fe7-466f-a7dc-d5928d5b6630', 3),
('872ac617-8687-4f8c-bf96-cc29f59b7b0a', 1),
('b5de3935-0002-43c6-a748-d6a655a55204', 4),
('c200e135-4125-4ee0-8e40-5607c45f2498', 5);

INSERT INTO "kss"."kwalificatieprofiel" ("id", "titel", "richting", "niveau_id") VALUES
('2b490053-b340-4b8d-807d-13b12146e951', 'Instructeur 4', 'instructeur', 'b5de3935-0002-43c6-a748-d6a655a55204'),
('60839761-8c3b-460d-bb37-6b03be4970ed', 'Leercoach 5', 'opleider', 'c200e135-4125-4ee0-8e40-5607c45f2498'),
('622c0044-eafc-4aed-a5d8-b079accde542', 'Instructeur 3', 'instructeur', '34f9a3d9-9fe7-466f-a7dc-d5928d5b6630'),
('759710a2-43af-4132-8de6-d39119a9b16a', 'Beoordelaar 5', 'opleider', 'c200e135-4125-4ee0-8e40-5607c45f2498'),
('828d211a-0ba4-485d-8838-5ad70818b427', 'Wal/waterhulp 1', 'instructeur', '872ac617-8687-4f8c-bf96-cc29f59b7b0a'),
('89e1ace9-0103-45ad-83f1-2ecfdc3cfaec', 'Leercoach 4', 'opleider', 'b5de3935-0002-43c6-a748-d6a655a55204'),
('97d3dd44-9e97-4ee4-836e-20269613dfdc', 'Instructeur 2', 'instructeur', '04512274-469c-4a07-b6e1-b175bd1b3d82'),
('a4e95e19-3258-4fc9-a154-c6fb60a55166', 'Instructeur 5', 'instructeur', 'c200e135-4125-4ee0-8e40-5607c45f2498'),
('a4ff31ab-16eb-478f-915c-82cc26e4fb37', 'Beoordelaar 4', 'opleider', 'b5de3935-0002-43c6-a748-d6a655a55204');

INSERT INTO "kss"."kerntaak" ("id", "titel", "kwalificatieprofiel_id", "type", "rang") VALUES
('54532cda-57f0-4c16-a189-0798d89a82a6', 'PvB 1.1 - Assisteren bij lessen en activiteiten', '828d211a-0ba4-485d-8838-5ad70818b427', 'verplicht', 11),
('16e5fee1-dbd7-4e59-ae15-cca3b2e5b42d', 'PvB 2.1 - Begeleiden van lessen', '97d3dd44-9e97-4ee4-836e-20269613dfdc', 'verplicht', 21),
('d4aeae60-d60c-46e4-869e-95bd7c587937', 'PvB 2.2 - Begeleiden bij vaardigheidstoetsen   ', '97d3dd44-9e97-4ee4-836e-20269613dfdc', 'verplicht', 22),
('447b12b8-a458-4fc4-8b0a-dc116bf6d6b5', 'PvB 3.1 - Geven van lessen', '622c0044-eafc-4aed-a5d8-b079accde542', 'verplicht', 31),
('da197b9d-f964-4bbb-bd49-5f46351501b7', 'PvB 3.4 - Aansturen van assisterend sportkader', '622c0044-eafc-4aed-a5d8-b079accde542', 'verplicht', 34),
('9bd12448-c473-4bd8-b74b-d3fbe694156f', 'PvB 3.5 - Afnemen van vaardigheidstoetsen', '622c0044-eafc-4aed-a5d8-b079accde542', 'verplicht', 35),
('aeb139db-7001-4632-b051-ae3167aaa6d8', 'PvB 4.1 - Geven van lessen', '2b490053-b340-4b8d-807d-13b12146e951', 'verplicht', 41),
('6091780a-9d28-41fe-ae42-376583b003ac', 'PvB 4.4 - Bevorderen van competentieontwikkeling sportkader', '89e1ace9-0103-45ad-83f1-2ecfdc3cfaec', 'verplicht', 44),
('f601638d-2041-4067-a807-4a46e22a7f17', 'PvB 4.5 - Samenwerken begeleidingsteam en onderhouden contacten', '89e1ace9-0103-45ad-83f1-2ecfdc3cfaec', 'verplicht', 45),
('8fc8121d-8286-453f-a728-ba9f593ac935', 'PvB 4.7 - Afnemen Proeven van Bekwaamheid', 'a4ff31ab-16eb-478f-915c-82cc26e4fb37', 'verplicht', 47),
('6de8ea9e-0696-47b9-830c-a6d37416bb97', 'PvB 4.8 - Afnemen van examens', '2b490053-b340-4b8d-807d-13b12146e951', 'verplicht', 48),
('062d6f93-32a8-4171-aa4e-ecdbb8c77e75', 'PvB 5.1 - Geven van lessen', 'a4e95e19-3258-4fc9-a154-c6fb60a55166', 'verplicht', 51),
('7bb72f8b-1434-4f75-9add-ee950cf7b296', 'PvB 5.3 - Ontwikkelen opleidingsprogramma’s', '60839761-8c3b-460d-bb37-6b03be4970ed', 'verplicht', 53),
('339f1a7c-21c7-4d4b-88fb-dc8e15142505', 'PvB 5.4 - Coachen van sportkade', '60839761-8c3b-460d-bb37-6b03be4970ed', 'verplicht', 54),
('c2e00228-1d3f-4e88-93ba-65ec762feb69', 'PvB 5.5 - Managen van begeleidingsteam', '60839761-8c3b-460d-bb37-6b03be4970ed', 'verplicht', 55),
('17e750ce-2690-4ca2-9932-02b5d2f42bb5', 'PvB 5.7 - Afnemen Proeven van Bekwaamheid', '759710a2-43af-4132-8de6-d39119a9b16a', 'verplicht', 57);

INSERT INTO "kss"."kerntaak_onderdeel" ("id", "kerntaak_id", "beoordelingsType") VALUES
('00e53941-3d60-4d80-acd8-4013ac2986cf', '7bb72f8b-1434-4f75-9add-ee950cf7b296', 'portfolio'),
('1eedd811-afc9-4d2f-9ee0-fbc29fef705a', '447b12b8-a458-4fc4-8b0a-dc116bf6d6b5', 'portfolio'),
('1fd944f4-5be0-4d7e-afcd-d6fdfdd819e0', '16e5fee1-dbd7-4e59-ae15-cca3b2e5b42d', 'praktijk'),
('256fbc15-5094-4f64-a03a-a9f0025a1ca3', '447b12b8-a458-4fc4-8b0a-dc116bf6d6b5', 'praktijk'),
('34a0fbfe-0a8e-4557-a5a6-e9782cca5ed7', '54532cda-57f0-4c16-a189-0798d89a82a6', 'praktijk'),
('3e9d59c2-b4a6-4bb1-ad9d-4ebcb1a7d7d6', '062d6f93-32a8-4171-aa4e-ecdbb8c77e75', 'portfolio'),
('4657c45a-8e1d-41f9-942d-38f0e95187cc', '339f1a7c-21c7-4d4b-88fb-dc8e15142505', 'portfolio'),
('467c3f5d-13d2-4e52-b37d-23d3f4d3a3af', 'da197b9d-f964-4bbb-bd49-5f46351501b7', 'portfolio'),
('47426de1-9fc0-4793-bdf1-b2ad838edbbb', '6091780a-9d28-41fe-ae42-376583b003ac', 'praktijk'),
('5c8993ba-b913-42ef-8dd9-3db917fca7f9', '6de8ea9e-0696-47b9-830c-a6d37416bb97', 'praktijk'),
('618f1248-3f6a-4cd4-b69a-66e419e38759', 'f601638d-2041-4067-a807-4a46e22a7f17', 'portfolio'),
('65e99d50-970e-4ee3-975c-63dac5742cdb', 'c2e00228-1d3f-4e88-93ba-65ec762feb69', 'portfolio'),
('680328ab-b283-472e-a571-03f45f996179', '062d6f93-32a8-4171-aa4e-ecdbb8c77e75', 'praktijk'),
('6ed32341-9a1a-46c9-9e00-e4d297768a61', 'aeb139db-7001-4632-b051-ae3167aaa6d8', 'portfolio'),
('7fc9247b-caa6-4889-b64b-b4394e293506', '17e750ce-2690-4ca2-9932-02b5d2f42bb5', 'portfolio'),
('8ce62770-17b0-4c82-aa4f-73d544a54389', '9bd12448-c473-4bd8-b74b-d3fbe694156f', 'portfolio'),
('9f452308-409c-4ceb-a51d-150a47b16d91', 'aeb139db-7001-4632-b051-ae3167aaa6d8', 'praktijk'),
('c8ef83e4-6461-4273-9991-1975632b1b40', '339f1a7c-21c7-4d4b-88fb-dc8e15142505', 'praktijk'),
('c9048d27-b2de-44ca-a776-9cef69c6d7bb', '8fc8121d-8286-453f-a728-ba9f593ac935', 'portfolio'),
('d46ebf91-a6fd-4e9c-b771-450e5321263a', '6091780a-9d28-41fe-ae42-376583b003ac', 'portfolio'),
('f05aacbe-4206-40c7-99f6-a8a10a48da7d', 'd4aeae60-d60c-46e4-869e-95bd7c587937', 'praktijk');
