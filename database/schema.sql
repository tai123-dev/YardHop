CREATE TABLE IF NOT EXISTS user(
    id  BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    create_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales(
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL, REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    zip TEXT NOT NULL,
    data DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    categories TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_sales (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sale_id     BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);