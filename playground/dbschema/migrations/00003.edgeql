CREATE MIGRATION m1eittjmr3ry4x23hx5bll3qlbj6a6trigilzj2mavjzid3xfuphka
    ONTO m1zwrwacfwgbpled2oup7peti2gy2szzsyrehrdtfd6pz6e77yxfrq
{
  CREATE TYPE default::BlogPost {
      CREATE REQUIRED PROPERTY content: std::str {
          SET default := '';
      };
      CREATE REQUIRED PROPERTY title: std::str;
  };
};
