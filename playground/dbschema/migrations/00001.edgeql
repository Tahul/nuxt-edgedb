CREATE MIGRATION m1jbkm4y44e6nhehi3rzza5kfylv3ymj4iy6vx6fftwae3pj5523fq
    ONTO initial
{
  CREATE TYPE default::BlogPost {
      CREATE REQUIRED PROPERTY content: std::str {
          SET default := '';
      };
      CREATE REQUIRED PROPERTY title: std::str;
  };
};
