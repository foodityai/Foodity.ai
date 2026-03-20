export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Mock login logic, would connect to DB here
    res.status(200).json({ token: 'mock_token', user: { email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    // Mock signup logic
    res.status(201).json({ token: 'mock_token', user: { name, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    // Mock get user logic
    res.status(200).json({ user: { name: 'Demo User', email: 'demo@example.com' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
