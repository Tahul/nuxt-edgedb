CREATE MIGRATION m1lmflqgxsmihc4iyaiz37ujsrhjqznhkbxbljgpfk32424z6o54oq
    ONTO m1axchg2g3dqbqj3762e34ypgx6ndkiyr6fpl2niu2elb3d3kr5nfq
{
  ALTER TYPE default::BlogPost {
      CREATE PROPERTY content: std::str {
          SET default := 'My blog post content.';
      };
  };
  ALTER TYPE default::BlogPost {
      CREATE PROPERTY description: std::str {
          SET default := 'My blog post description.';
      };
  };
  ALTER TYPE default::BlogPost {
      DROP PROPERTY text;
  };
  ALTER TYPE default::BlogPost {
      CREATE PROPERTY title: std::str {
          SET default := 'My blog post';
      };
  };
};
