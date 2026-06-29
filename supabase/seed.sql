insert into public.districts(name,province,population_estimate,centroid_lat,centroid_lng) values
('Chililabombwe','Copperbelt',142138,-12.367,27.828),('Chingola','Copperbelt',300651,-12.539,27.859),
('Kalulushi','Copperbelt',170000,-12.842,28.091),('Kitwe','Copperbelt',762981,-12.816,28.200),
('Luanshya','Copperbelt',172930,-13.136,28.416),('Lufwanyama','Copperbelt',105156,-12.982,27.619),
('Masaiti','Copperbelt',177839,-13.257,28.404),('Mpongwe','Copperbelt',135621,-13.512,28.156),
('Mufulira','Copperbelt',200857,-12.551,28.241),('Ndola','Copperbelt',627503,-12.991,28.650)
on conflict(name) do update set population_estimate=excluded.population_estimate;
