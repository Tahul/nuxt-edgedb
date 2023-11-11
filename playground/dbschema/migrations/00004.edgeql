CREATE MIGRATION m1sud5ypmrvg5fcfusxf7miibzdzcv4d3jwsaowipxnkcor5v2f77q
    ONTO m1eittjmr3ry4x23hx5bll3qlbj6a6trigilzj2mavjzid3xfuphka
{
  ALTER TYPE default::BlogPost {
      CREATE PROPERTY description: std::str;
  };
};
