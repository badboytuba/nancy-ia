# Gunicorn config file

# Bind the application to the given host and port
bind = '167.99.200.88:3000'

# Number of worker processes for handling requests
workers = 4

# Maximum number of requests a worker will process before restarting
max_requests = 1000

# Maximum number of requests a worker will process before graceful shutdown
max_requests_jitter = 100

# The timeout for worker processes to gracefully exit
timeout = 30

# Set the access log format
accesslog = '-'
